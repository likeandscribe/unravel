import "server-only";
import {
  exportJWK,
  importJWK,
  SignJWT,
  jwtVerify,
  calculateJwkThumbprint,
} from "jose";
import { cache } from "react";
import {
  DID,
  getDidFromHandleOrDid,
  getPdsUrl,
  parseDid,
} from "./data/atproto/did";
import {
  discoveryRequest,
  processDiscoveryResponse,
  pushedAuthorizationRequest,
  generateRandomState,
  calculatePKCECodeChallenge,
  generateRandomCodeVerifier,
  generateKeyPair,
  authorizationCodeGrantRequest,
  validateAuthResponse,
  protectedResourceRequest,
  revocationRequest,
  parseWwwAuthenticateChallenges,
  Client as OauthClient,
} from "oauth4webapi";
import { cookies, headers } from "next/headers";
import type { KeyObject } from "node:crypto";
import {
  OAuthClientMetadata,
  oauthParResponseSchema,
  oauthProtectedResourceMetadataSchema,
  oauthTokenResponseSchema,
} from "@atproto/oauth-types";
import { redirect, RedirectType } from "next/navigation";
import { db } from "./db";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const USER_AGENT = "appview/@frontpage.fyi (@tom-sherman.com)";

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

// TODO: Cache this?
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
    // TODO: Tweak these?
    scope: "atproto transition:generic",
    client_name: "Frontpage",
    token_endpoint_auth_method: "none",
    redirect_uris: [`${appUrl}/oauth/callback`] as const,
    client_uri: appUrl,
    jwks_uri: `${appUrl}/oauth/jwks.json`,
  } satisfies OAuthClientMetadata;
});

export const getOauthClientOptions = () =>
  ({
    client_id: getClientMetadata().client_id,
    token_endpoint_auth_method: "private_key_jwt",
  }) satisfies OauthClient;

async function getClientPrivateKey() {
  const jwk = await exportJWK(await getPrivateJwk());
  const kid = await calculateJwkThumbprint(jwk);
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );

  return { key, kid };
}

export async function signIn(handle: string) {
  const did = await getDidFromHandleOrDid(handle);
  if (!did) {
    return {
      error: "DID_NOT_FOUND",
    };
  }

  const meta = await oauthProtectedMetadataRequest(did);
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
    await discoveryRequest(new URL(authServerUrl), {
      algorithm: "oauth2",
    }),
  );

  // Check this early, we'll need it later
  const authorizationEndpiont = authServer.authorization_endpoint;
  if (!authorizationEndpiont) {
    return {
      error: "NO_AUTHORIZATION_ENDPOINT",
    };
  }

  const client = getClientMetadata();

  const state = generateRandomState();
  const pkceVerifier = generateRandomCodeVerifier();

  const dpopKeyPair = await generateKeyPair("RS256", {
    extractable: true,
  });

  const makeParRequest = async (dpopNonce?: string) => {
    return pushedAuthorizationRequest(
      authServer,
      getOauthClientOptions(),
      {
        response_type: "code",
        code_challenge: await calculatePKCECodeChallenge(pkceVerifier),
        code_challenge_method: "S256",
        // TODO: Do we need this? It's included in the oauth client options
        client_id: client.client_id,
        state,
        redirect_uri: client.redirect_uris[0],
        scope: client.scope,
        login_hint: handle,
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
        error: "MISSING_PAR_DPOP_NONCE",
      };
    }
    // Try again with new nonce
    parResponse = await makeParRequest(dpopNonce);
  }

  if (!parResponse.ok) {
    console.error("PAR error: ", await parResponse.text());
    return {
      error: "FAILED_TO_PUSH_AUTHORIZATION_REQUEST",
    };
  }

  const dpopNonce = parResponse.headers.get("DPoP-Nonce");

  if (!dpopNonce) {
    return {
      error: "MISSING_PAR_DPOP_NONCE",
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

function oauthDiscoveryRequest(url: URL) {
  return discoveryRequest(url, {
    algorithm: "oauth2",
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
}

// TODO: Split this out to match the oauth4webapi pattern of processProtectedMetadataResponse(oauthProtectedMetadataRequest())
async function oauthProtectedMetadataRequest(did: DID) {
  const pds = await getPdsUrl(did);
  if (!pds) {
    return {
      error: "PDS_NOT_FOUND" as const,
    };
  }

  const response = await fetch(`${pds}/.well-known/oauth-protected-resource`, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
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

const AUTH_COOKIE_NAME = "__auth_sesion";

// This is to mimic next-auth's API, hopefully we can upstream later
export const handlers = {
  GET: async (request: Request) => {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/client-metadata.json")) {
      return Response.json(getClientMetadata());
    }

    const key = await exportJWK(await getPublicJwk());

    if (url.pathname.endsWith("/jwks.json")) {
      return Response.json({
        keys: [
          {
            ...key,
            kid: await calculateJwkThumbprint(key),
          },
        ],
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
        await oauthDiscoveryRequest(new URL(iss)),
      );

      const client = getClientMetadata();
      const params = validateAuthResponse(
        authServer,
        getOauthClientOptions(),
        url.searchParams,
        row.state,
      );

      if (!(params instanceof URLSearchParams)) {
        console.error("Invalid params", params);
        return new Response("Invalid params", { status: 400 });
      }

      const { privateDpopKey, publicDpopKey } = await importDpopJwks({
        privateJwk: row.dpopPrivateJwk,
        publicJwk: row.dpopPublicJwk,
      });

      const authCodeResponse = await authorizationCodeGrantRequest(
        authServer,
        getOauthClientOptions(),
        params,
        client.redirect_uris[0],
        row.pkceVerifier,
        {
          clientPrivateKey: await getClientPrivateKey(),
          DPoP: {
            privateKey: privateDpopKey,
            publicKey: publicDpopKey,
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

      if (!tokensResult.data.expires_in) {
        throw new Error("Missing expires");
      }

      await db.insert(schema.OauthSession).values({
        did: row.did,
        username: row.username,
        iss: row.iss,
        accessToken: tokensResult.data.access_token,
        refreshToken: tokensResult.data.refresh_token,
        expiresAt: new Date(Date.now() + tokensResult.data.expires_in * 1000),
        createdAt: new Date(),
        dpopNonce,
        dpopPrivateJwk: row.dpopPrivateJwk,
        dpopPublicJwk: row.dpopPublicJwk,
      });

      const userToken = await new SignJWT()
        .setSubject(row.did)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuedAt()
        .sign(
          // TODO: This probably ought to be a different key
          await getPrivateJwk(),
        );

      cookies().set(AUTH_COOKIE_NAME, userToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      });

      return redirect("/", RedirectType.replace);
    }

    return new Response("Not found", { status: 404 });
  },
};

export async function signOut() {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  cookies().delete(AUTH_COOKIE_NAME);
  const authServer = await processDiscoveryResponse(
    new URL(session.user.iss),
    await oauthDiscoveryRequest(new URL(session.user.iss)),
  );

  await revocationRequest(
    authServer,
    getOauthClientOptions(),
    session.user.accessToken,
    {
      clientPrivateKey: await getClientPrivateKey(),
    },
  );

  await db
    .delete(schema.OauthSession)
    .where(eq(schema.OauthSession.did, session.user.did));
  redirect("/");
}

export const getSession = cache(async () => {
  const tokenCookie = cookies().get(AUTH_COOKIE_NAME);
  if (!tokenCookie) {
    return null;
  }

  let token;
  try {
    token = await jwtVerify(tokenCookie.value, await getPublicJwk(), {});
  } catch (e) {
    console.error("Failed to verify token", e);
    return null;
  }

  if (!token.payload.sub) {
    return null;
  }

  const did = parseDid(token.payload.sub);
  if (!did) {
    return null;
  }

  const [session] = await db
    .select()
    .from(schema.OauthSession)
    .where(eq(schema.OauthSession.did, did));

  if (!session) {
    return null;
  }

  return {
    user: session,
  };
});

async function importDpopJwks({
  privateJwk,
  publicJwk,
}: {
  privateJwk: string;
  publicJwk: string;
}) {
  const [privateDpopKey, publicDpopKey] = await Promise.all([
    crypto.subtle.importKey(
      "jwk",
      JSON.parse(privateJwk),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["sign"],
    ),
    crypto.subtle.importKey(
      "jwk",
      JSON.parse(publicJwk),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["verify"],
    ),
  ]);

  return {
    publicDpopKey,
    privateDpopKey,
  };
}

export async function fetchAuthenticatedAtproto(
  input: RequestInfo,
  init?: RequestInit,
) {
  const session = await getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const { privateDpopKey, publicDpopKey } = await importDpopJwks({
    privateJwk: session.user.dpopPrivateJwk,
    publicJwk: session.user.dpopPublicJwk,
  });

  const makeRequest = (dpopNonce: string) => {
    // It's important to reconstruct the request because we can't send the same body readable stream twice
    const request = new Request(input, init);
    return protectedResourceRequest(
      session.user.accessToken,
      request.method,
      new URL(request.url),
      request.headers,
      request.body,
      {
        DPoP: {
          privateKey: privateDpopKey,
          publicKey: publicDpopKey,
          nonce: dpopNonce,
        },
      },
    );
  };

  let response = await makeRequest(session.user.dpopNonce);

  if (response.status === 401) {
    if (
      // Expect a use_dpop_nonce error
      !parseWwwAuthenticateChallenges(response)?.some(
        (challenge) => challenge.parameters.error === "use_dpop_nonce",
      )
    ) {
      throw new Error("Not expecting error: " + (await response.text()));
    }

    const dpopNonce2 = response.headers.get("DPoP-Nonce");
    if (!dpopNonce2) {
      throw new Error("Missing DPoP nonce");
    }
    console.log("new nonce", dpopNonce2);

    response = await makeRequest(dpopNonce2);
  }

  const dpopNonce = response.headers.get("DPoP-Nonce");
  if (!dpopNonce) {
    throw new Error("Missing DPoP nonce");
  }

  await db
    .update(schema.OauthSession)
    .set({
      dpopNonce,
    })
    .where(eq(schema.OauthSession.sessionId, session.user.sessionId));

  return response;
}
