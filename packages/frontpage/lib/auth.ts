import "server-only";
import { exportJWK, importJWK, JWK } from "jose";
import { cache } from "react";
import { DID, getDidFromHandleOrDid } from "./data/atproto/did";
import { getPdsUrl } from "./data/user";
import { z } from "zod";
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

export const getClientConfig = cache(() => {
  let appUrl;
  if (process.env.NODE_ENV === "development") {
    appUrl = `https://${headers().get("host")}`;
  }

  appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL!;

  return {
    client_id: `frontpage-${process.env.NODE_ENV === "production" ? "prod" : "nonprod"}`,
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
  };
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

  const authServerUrl = meta.data.authorization_servers[0];
  if (!authServerUrl) {
    return {
      error: "NO_AUTH_SERVER",
    };
  }

  const authServer = await processDiscoveryResponse(
    new URL(authServerUrl),
    await discoveryRequest(new URL(authServerUrl)),
  );

  const client = getClientConfig();

  const [secretJwk, kid] = await Promise.all([
    getPrivateJwk().then(exportJWK),
    getPublicJwk()
      .then(exportJWK)
      .then((jwk) => jwk.kid),
  ]);

  console.log(authServer);

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

  console.log(parResponse.status);
  console.log(await parResponse.text());
}

function importJwkForPar(jwk: JWK) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );
}

const OauthProtectedResource = z.object({
  authorization_servers: z.array(z.string()),
});

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

  const result = OauthProtectedResource.safeParse(data);
  if (!result.success) {
    return {
      error: "INVALID_METADATA" as const,
      cause: result.error,
    };
  }

  return { data: result.data };
}

export async function signOut() {}

export function getSession() {
  return null;
}
