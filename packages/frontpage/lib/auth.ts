import "server-only";
import { exportJWK, importJWK } from "jose";
import { cache } from "react";
import { DID, getDidFromHandleOrDid } from "./data/atproto/did";
import { getPdsUrl } from "./data/user";
import {
  discoveryRequest,
  processDiscoveryResponse,
  pushedAuthorizationRequest,
  generateRandomState,
  calculatePKCECodeChallenge,
  generateRandomCodeVerifier,
  generateRandomNonce,
} from "oauth4webapi";
import { headers } from "next/headers";
import type { KeyObject } from "node:crypto";
import {
  OAuthClientMetadata,
  oauthParResponseSchema,
  oauthProtectedResourceMetadataSchema,
} from "@atproto/oauth-types";
import { redirect } from "next/navigation";

export const getPrivateJwk = cache(() =>
  importJWK<KeyObject>(JSON.parse(process.env.PRIVATE_JWK!)),
);

export const getPublicJwk = cache(async () => {
  const jwk = await importJWK(JSON.parse(process.env.PUBLIC_JWK!));
  if ("d" in jwk) {
    throw new Error("Expected public JWK, got private JWK");
  }

  return jwk;
});

export const getClientMetadata = cache(() => {
  const appUrl =
    process.env.NODE_ENV === "development"
      ? `https://${headers().get("host")}`
      : process.env.VERCEL_PROJECT_PRODUCTION_URL!;

  return {
    // Client ID is the URL of the client metadata
    // This isn't immediately obvious and if you supply something else the PAR request will fail with a 400 "Invalid url" error. I had to traverse the atproto implementation to find out why!
    client_id: `${appUrl}/oauth/client-metadata.json`,
    dpop_bound_access_tokens: true,
    application_type: "web",
    subject_type: "public",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"], // TODO: "code id_token"?
    scope: "openid profile offline_access",
    client_name: "Frontpage",
    token_endpoint_auth_method: "none",
    redirect_uris: [`${appUrl}/oauth/callback`] as const,
    client_uri: appUrl,
    jwks_uri: `${appUrl}/oauth/jwks.json`,
  } satisfies OAuthClientMetadata;
});

export async function signIn(handle: string) {
  const did = await getDidFromHandleOrDid(handle);
  if (!did) {
    return {
      error: "DID_NOT_FOUND",
    };
  }

  const meta = await getOauthResourceMetadata(did);
  if ("error" in meta) {
    return meta;
  }

  const authServerUrl = meta.data.authorization_servers?.[0];
  if (!authServerUrl) {
    return {
      error: "NO_AUTH_SERVER",
    };
  }

  const authServer = await processDiscoveryResponse(
    new URL(authServerUrl),
    await discoveryRequest(new URL(authServerUrl)),
  );

  // Check this early, we'll need it later
  const authorizationEndpiont = authServer.authorization_endpoint;
  if (!authorizationEndpiont) {
    return {
      error: "NO_AUTHORIZATION_ENDPOINT",
    };
  }

  const client = getClientMetadata();

  const [secretJwk, kid] = await Promise.all([
    getPrivateJwk().then(exportJWK),
    getPublicJwk()
      .then(exportJWK)
      .then((jwk) => jwk.kid),
  ]);

  const parResponse = await pushedAuthorizationRequest(
    authServer,
    {
      client_id: client.client_id,
      token_endpoint_auth_method: "private_key_jwt",
    },
    {
      response_type: "code",
      code_challenge: await calculatePKCECodeChallenge(
        generateRandomCodeVerifier(),
      ),
      code_challenge_method: "S256",
      client_id: client.client_id,
      state: generateRandomState(),
      nonce: generateRandomNonce(),
      redirect_uri: client.redirect_uris[0],
      // TODO: Tweak these?
      scope: "openid profile offline_access",
      login_hint: handle,
    },
    {
      // TODO: Implement dpop but webcrypto doesn't support ECDSA...
      // DPoP: {
      //   privateKey,
      //   publicKey,
      // },
      clientPrivateKey: {
        key: await crypto.subtle.importKey(
          "jwk",
          secretJwk,
          { name: "ECDSA", namedCurve: "P-256" },
          true,
          ["sign"],
        ),
        kid,
      },
    },
  );

  if (!parResponse.ok) {
    console.error("PAR error: ", await parResponse.text());
    return {
      error: "FAILED_TO_PUSH_AUTHORIZATION_REQUEST",
    };
  }

  const parResult = oauthParResponseSchema.safeParse(await parResponse.json());
  if (!parResult.success) {
    return {
      error: "INVALID_PAR_RESPONSE",
      cause: parResult.error,
    };
  }

  // TODO: Save oauth request and state to DB for later verification
  const redirectUrl = new URL(authServer.authorization_endpoint);
  redirectUrl.searchParams.set("request_uri", parResult.data.request_uri);
  redirectUrl.searchParams.set("client_id", client.client_id);
  redirect(redirectUrl.toString());
}

async function getOauthResourceMetadata(did: DID) {
  const pds = await getPdsUrl(did);
  if (!pds) {
    return {
      error: "PDS_NOT_FOUND" as const,
    };
  }

  const response = await fetch(`${pds}/.well-known/oauth-protected-resource`);
  if (response.status !== 200) {
    return {
      error: "FAILED_TO_FETCH_METADATA" as const,
    };
  }

  const data = await response.json();

  const result = oauthProtectedResourceMetadataSchema.safeParse(data);
  if (!result.success) {
    return {
      error: "INVALID_METADATA" as const,
      cause: result.error,
    };
  }

  return { data: result.data };
}

export async function signOut() {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSession(): any {
  return null;
}
