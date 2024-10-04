import {
  calculatePKCECodeChallenge,
  discoveryRequest,
  generateKeyPair,
  generateRandomCodeVerifier,
  generateRandomState,
  processDiscoveryResponse,
  pushedAuthorizationRequest,
} from "oauth4webapi";
import {
  getClientMetadata,
  getClientPrivateKey,
  getOauthClientOptions,
  oauthProtectedMetadataRequest,
} from "./auth";
import { getDidFromHandleOrDid } from "./data/atproto/identity";
import { oauthParResponseSchema } from "@atproto/oauth-types";
import { db } from "./db";
import * as schema from "./schema";
import { redirect } from "next/navigation";

export async function signIn(identifier: string) {
  const did = await getDidFromHandleOrDid(identifier);
  if (!did) {
    return {
      error: "DID_NOT_FOUND" as const,
    };
  }

  const meta = await oauthProtectedMetadataRequest(did);
  if ("error" in meta) {
    return meta;
  }

  const authServerUrl = meta.data.authorization_servers?.[0];
  if (!authServerUrl) {
    return {
      error: "NO_AUTH_SERVER" as const,
    };
  }

  // TODO: Cache this
  const authServer = await processDiscoveryResponse(
    new URL(authServerUrl),
    await discoveryRequest(new URL(authServerUrl), {
      algorithm: "oauth2",
    }),
  );

  // Check this early, we'll need it later
  const authorizationEndpiont = authServer.authorization_endpoint;
  if (!authorizationEndpiont) {
    return {
      error: "NO_AUTHORIZATION_ENDPOINT" as const,
    };
  }

  const client = await getClientMetadata();

  const state = generateRandomState();
  const pkceVerifier = generateRandomCodeVerifier();

  const dpopKeyPair = await generateKeyPair("RS256", {
    extractable: true,
  });

  const makeParRequest = async (dpopNonce?: string) => {
    return pushedAuthorizationRequest(
      authServer,
      await getOauthClientOptions(),
      {
        response_type: "code",
        code_challenge: await calculatePKCECodeChallenge(pkceVerifier),
        code_challenge_method: "S256",
        // TODO: Do we need this? It's included in the oauth client options
        client_id: client.client_id,
        state,
        redirect_uri: client.redirect_uris[0],
        scope: client.scope,
        login_hint: identifier,
      },
      {
        DPoP: {
          privateKey: dpopKeyPair.privateKey,
          publicKey: dpopKeyPair.publicKey,
          nonce: dpopNonce,
        },
        clientPrivateKey: await getClientPrivateKey(),
      },
    );
  };

  // Try PAR request without DPoP nonce first
  // oauth4webapi has an in-memory cache that may be used here
  let parResponse = await makeParRequest();

  if (!parResponse.ok) {
    // TODO: Check for this error when the header is deployed by bsky team
    // if (
    //   // Expect a use_dpop_nonce error
    //   !parseWwwAuthenticateChallenges(parResponse)?.some(
    //     (challenge) => challenge.parameters.error === "use_dpop_nonce",
    //   )
    // ) {
    //   return {
    //     error: "FAILED_TO_PUSH_AUTHORIZATION_REQUEST",
    //   };
    // }

    const dpopNonce = parResponse.headers.get("DPoP-Nonce");
    if (!dpopNonce) {
      return {
        error: "MISSING_PAR_DPOP_NONCE" as const,
      };
    }
    // Try again with new nonce
    parResponse = await makeParRequest(dpopNonce);
  }

  if (!parResponse.ok) {
    console.error("PAR error: ", await parResponse.text());
    return {
      error: "FAILED_TO_PUSH_AUTHORIZATION_REQUEST" as const,
    };
  }

  const dpopNonce = parResponse.headers.get("DPoP-Nonce");

  if (!dpopNonce) {
    return {
      error: "MISSING_PAR_DPOP_NONCE" as const,
    };
  }

  const parResult = oauthParResponseSchema.safeParse(await parResponse.json());
  if (!parResult.success) {
    return {
      error: "INVALID_PAR_RESPONSE" as const,
      cause: parResult.error,
    };
  }

  await db.insert(schema.OauthAuthRequest).values({
    did: did,
    iss: authServer.issuer,
    username: identifier,
    nonce: dpopNonce,
    state,
    pkceVerifier,
    dpopPrivateJwk: JSON.stringify(
      await crypto.subtle.exportKey("jwk", dpopKeyPair.privateKey),
    ),
    expiresAt: new Date(Date.now() + 1000 * 60),
    createdAt: new Date(),
    dpopPublicJwk: JSON.stringify(
      await crypto.subtle.exportKey("jwk", dpopKeyPair.publicKey),
    ),
  });

  const redirectUrl = new URL(authServer.authorization_endpoint);
  redirectUrl.searchParams.set("request_uri", parResult.data.request_uri);
  redirectUrl.searchParams.set("client_id", client.client_id);
  redirect(redirectUrl.toString());
}
