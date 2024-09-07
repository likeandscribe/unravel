import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  processDiscoveryResponse,
  refreshTokenGrantRequest,
  processRefreshTokenResponse,
} from "oauth4webapi";
import { db } from "./lib/db";
import * as schema from "./lib/schema";
import {
  getClientPrivateKey,
  getOauthClientOptions,
  getSession,
  importDpopJwks,
  oauthDiscoveryRequest,
} from "./lib/auth";

export async function middleware(_request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.next();
  }

  if (session.user.expiresAt.getTime() > new Date().getTime() - 500) {
    const authServer = await processDiscoveryResponse(
      new URL(session.user.iss),
      await oauthDiscoveryRequest(new URL(session.user.iss)),
    );

    const client = getOauthClientOptions();

    const { privateDpopKey, publicDpopKey } = await importDpopJwks({
      privateJwk: session.user.dpopPrivateJwk,
      publicJwk: session.user.dpopPublicJwk,
    });

    let response = await refreshTokenGrantRequest(
      authServer,
      client,
      session.user.refreshToken,
      {
        clientPrivateKey: await getClientPrivateKey(),
        DPoP: {
          privateKey: privateDpopKey,
          publicKey: publicDpopKey,
          nonce: session.user.dpopNonce,
        },
      },
    );

    let result = await processRefreshTokenResponse(
      authServer,
      client,
      response,
    );

    if ("error" in result && result.error == "use_dpop_nonce") {
      const nonce = response.headers.get("DPoP-Nonce");
      if (!nonce) {
        throw new Error("Missing DPoP nonce");
      }
      response = await refreshTokenGrantRequest(
        authServer,
        client,
        session.user.refreshToken,
        {
          clientPrivateKey: await getClientPrivateKey(),
          DPoP: {
            privateKey: privateDpopKey,
            publicKey: publicDpopKey,
            nonce: nonce,
          },
        },
      );

      result = await processRefreshTokenResponse(authServer, client, response);
    }

    if (
      "error" in result &&
      result.error === "invalid_grant" &&
      result.error_description === "refresh token replayed"
    ) {
      // Concurrent refresh token replayed, just ignore for now
      console.warn("Concurrent refresh token replayed");
      return NextResponse.next();
    }

    if ("error" in result) {
      // Logout and show error
      console.error(result);
      throw new Error("not implemented");
    }

    const dpopNonce = response.headers.get("DPoP-Nonce");
    if (!dpopNonce) {
      throw new Error("Missing DPoP nonce");
    }

    if (result.expires_in == null) {
      throw new Error("Missing expires_in");
    }

    // TODO: Check sub against did and diddoc.id

    await db
      .update(schema.OauthSession)
      .set({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expiresAt: new Date(Date.now() + result.expires_in * 1000),
        dpopNonce,
      })
      .where(eq(schema.OauthSession.sessionId, session.user.sessionId));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
