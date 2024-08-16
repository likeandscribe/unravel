import "server-only";
import { exportJWK, importJWK, SignJWT } from "jose";
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
  generateKeyPair,
  authorizationCodeGrantRequest,
  validateAuthResponse,
} from "oauth4webapi";
import { cookies, headers } from "next/headers";
import type { KeyObject } from "node:crypto";
import {
  OAuthClientMetadata,
  oauthParResponseSchema,
  oauthProtectedResourceMetadataSchema,
  oauthTokenResponseSchema,
} from "@atproto/oauth-types";
import { redirect } from "next/navigation";
import { db } from "./db";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

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
  const host =
    process.env.NODE_ENV === "development"
      ? headers().get("host")
      : process.env.VERCEL_ENV === "production"
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL!
        : process.env.VERCEL_BRANCH_URL!;

  const appUrl = `https://${host}`;

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

async function getClientPrivateKey() {
  return crypto.subtle.importKey(
    "jwk",
    await exportJWK(await getPrivateJwk()),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );
}

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

  const [clientPrivateKey, kid] = await Promise.all([
    getClientPrivateKey(),
    getPublicJwk()
      .then(exportJWK)
      .then((jwk) => jwk.kid),
  ]);

  const nonce = generateRandomNonce();
  const state = generateRandomState();
  const pkceVerifier = generateRandomCodeVerifier();

  const dpopKeyPair = await generateKeyPair("RS256", {
    extractable: true,
  });

  const makeParRequest = async (dpopNonce?: string) => {
    return pushedAuthorizationRequest(
      authServer,
      {
        client_id: client.client_id,
        token_endpoint_auth_method: "private_key_jwt",
      },
      {
        response_type: "code",
        code_challenge: await calculatePKCECodeChallenge(pkceVerifier),
        code_challenge_method: "S256",
        client_id: client.client_id,
        state,
        nonce,
        redirect_uri: client.redirect_uris[0],
        // TODO: Tweak these?
        scope: "openid profile offline_access",
        login_hint: handle,
      },
      {
        DPoP: {
          privateKey: dpopKeyPair.privateKey,
          publicKey: dpopKeyPair.publicKey,
          expiresIn: 30,
          nonce: dpopNonce,
        },
        clientPrivateKey: {
          key: clientPrivateKey,
          kid,
        },
      },
    );
  };

  // Make the PAR request without dpop nonce
  const parDpopNonceDiscoveryResponse = await makeParRequest();
  // We expect a 400 response here because we didn't include a DPoP nonce
  if (parDpopNonceDiscoveryResponse.status !== 400) {
    console.error("PAR error: ", await parDpopNonceDiscoveryResponse.text());
    return {
      error: "FAILED_TO_PUSH_AUTHORIZATION_REQUEST",
    };
  }

  const dpopNonce = parDpopNonceDiscoveryResponse.headers.get("DPoP-Nonce");
  if (!dpopNonce) {
    return {
      error: "MISSING_PAR_DPOP_NONCE",
    };
  }

  const parResponse = await makeParRequest(dpopNonce);

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

  await db.insert(schema.OauthAuthRequest).values({
    did: did,
    iss: authServer.issuer,
    username: handle,
    nonce: dpopNonce,
    state,
    pkceVerifier,
    dpopPrivateJwk: JSON.stringify(
      await crypto.subtle.exportKey("jwk", dpopKeyPair.privateKey),
    ),
    dpopPublicJwk: JSON.stringify(
      await crypto.subtle.exportKey("jwk", dpopKeyPair.publicKey),
    ),
  });

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

// This is to mimic next-auth's API, hopefully we can upstream later
export const handlers = {
  GET: async (request: Request) => {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/client-metadata.json")) {
      return Response.json(getClientMetadata());
    }

    if (url.pathname.endsWith("/jwks.json")) {
      return Response.json({
        keys: [await exportJWK(await getPublicJwk())],
      });
    }

    if (url.pathname.endsWith("/callback")) {
      // TODO: Show error UI each time we throw/return an error
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const iss = url.searchParams.get("iss");
      if (!state || !code || !iss) {
        console.error("missing params", { state, code, iss });
        return new Response("Invalid request", { status: 400 });
      }

      const [row] = await db
        .select()
        .from(schema.OauthAuthRequest)
        .where(eq(schema.OauthAuthRequest.state, state));

      if (!row) {
        return new Response("OAuth request not found", { status: 400 });
      }

      // Delete row to prevent replay attacks
      await db
        .delete(schema.OauthAuthRequest)
        .where(eq(schema.OauthAuthRequest.state, state));

      if (row.iss !== iss) {
        throw new Error("Invalid issuer");
      }

      // Redundant check because of the db query, but it's good to be safe
      if (row.state !== state) {
        throw new Error("Invalid state");
      }

      const authServer = await processDiscoveryResponse(
        new URL(iss),
        await discoveryRequest(new URL(iss)),
      );

      const client = getClientMetadata();
      const params = validateAuthResponse(
        authServer,
        {
          client_id: client.client_id,
          token_endpoint_auth_method: "private_key_jwt",
        },
        url.searchParams,
        row.state,
      );

      if (!(params instanceof URLSearchParams)) {
        console.error("Invalid params", params);
        return new Response("Invalid params", { status: 400 });
      }

      const privateDpopKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(row.dpopPrivateJwk),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        true,
        ["sign"],
      );

      const publicDpopKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(row.dpopPublicJwk),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        true,
        ["verify"],
      );

      const authCodeResponse = await authorizationCodeGrantRequest(
        authServer,
        {
          client_id: client.client_id,
          token_endpoint_auth_method: "private_key_jwt",
        },
        params,
        client.redirect_uris[0],
        row.pkceVerifier,
        {
          clientPrivateKey: await getClientPrivateKey(),
          DPoP: {
            privateKey: privateDpopKey,
            publicKey: publicDpopKey,
            expiresIn: 30,
            nonce: row.nonce,
          },
        },
      );

      if (!authCodeResponse.ok) {
        console.error("Auth code error: ", await authCodeResponse.text());
        throw new Error("Failed to exchange auth code");
      }

      const tokensResult = oauthTokenResponseSchema.safeParse(
        await authCodeResponse.json(),
      );
      if (!tokensResult.success) {
        console.error("Invalid tokens", tokensResult.error);
        throw new Error("Invalid tokens");
      }

      const dpopNonce = authCodeResponse.headers.get("DPoP-Nonce");
      if (!dpopNonce) {
        throw new Error("Missing DPoP nonce");
      }

      if (!tokensResult.data.refresh_token) {
        throw new Error("Missing refresh");
      }

      await db.insert(schema.OauthSession).values({
        did: row.did,
        username: row.username,
        iss: row.iss,
        accessToken: tokensResult.data.access_token,
        refreshToken: tokensResult.data.refresh_token,
        dpopNonce,
        dpopPrivateJwk: row.dpopPrivateJwk,
        dpopPublicJwk: row.dpopPublicJwk,
      });

      const userToken = await new SignJWT({ sub: row.did })
        .setProtectedHeader({ alg: "ES256" })
        .setIssuedAt()
        .sign(await getPrivateJwk());

      cookies().set("user", userToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      });

      redirect("/");
    }

    return new Response("Not found", { status: 404 });
  },
};

export async function signOut() {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSession(): any {
  return null;
}
