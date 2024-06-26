import "server-only";
import NextAuth, { DefaultSession, NextAuthResult } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cache } from "react";
import { z } from "zod";
import { decodeJwt } from "jose";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      refreshJwt: string;
      accessJwt: string;
    } & DefaultSession["user"];
  }

  interface User {
    refreshJwt: string;
    accessJwt: string;
  }
}

const Credentials = z.object({
  identifier: z.string(),
  password: z.string(),
});

const auth = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        identifier: {},
        password: {},
      },
      authorize: async (unsafeCredentials) => {
        console.log("authorizing...");
        const credentials = Credentials.parse(unsafeCredentials);
        const session = await atprotoCreateSession({
          password: credentials.password,
          identifier:
            // Remove @ from start if it's there
            credentials.identifier.replace(/^@/, ""),
        });

        return {
          id: session.did,
          name: session.handle,
          email: session.email,
          refreshJwt: session.refreshJwt,
          accessJwt: session.accessJwt,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user: authorizedInfo }) => {
      if (authorizedInfo) {
        //first login/sign up
        const accessTokenDecoded = decodeJwt(authorizedInfo.accessJwt);

        return {
          ...token,
          accessJwt: authorizedInfo.accessJwt,
          expiresAt: accessTokenDecoded.exp! * 1000,
          refreshJwt: authorizedInfo.refreshJwt,
          sub: authorizedInfo.id,
        };
      } else if (
        Date.now() + 500 <
        // @ts-expect-error it's unknown but we know it's a number
        token.expiresAt
      ) {
        return token;
      }

      if (!token.refreshJwt) throw new Error("No refresh token");

      console.log("here");
      //do some refreshing
      try {
        const session = await atprotoRefreshSession(token.refreshJwt as string);
        return {
          ...token,
          accessJwt: session.accessJwt,
          expiresAt: decodeJwt(session.accessJwt).exp! * 1000,
          refreshJwt: session.refreshJwt,
        };
      } catch (e) {
        console.error("Error refreshing token", e);
        return null;
      }
    },
    session: async ({ session, token }) => {
      session.user.refreshJwt = token.refreshJwt as string;
      session.user.accessJwt = token.accessJwt as string;
      return session;
    },
  },
});

export const signIn = async (formData: FormData) => {
  await auth.signIn("credentials", formData);
};
export const signOut = async () => {
  await auth.signOut();
};
// TODO: Use this in middleware.ts. Wasn't working in next 15 with turbo
// See https://github.com/vercel/next.js/issues/66162#issuecomment-2135529800
export const middleware: NextAuthResult["auth"] = auth.auth;
export const getSession = cache(() => {
  return auth.auth();
});

const AtprotoSession = z.object({
  accessJwt: z.string(),
  refreshJwt: z.string(),
  handle: z.string(),
  did: z.string(),
  //email only exists on createSession but no refreshSession
  email: z.string().optional(),
});

const atprotoCreateSession = async ({
  identifier,
  password,
}: z.infer<typeof Credentials>) => {
  return AtprotoSession.parse(
    await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier,
        password: password,
      }),
    }).then((res) => res.json()),
  );
};

const atprotoRefreshSession = async (refreshJwt: string) => {
  console.log("refreshing...");
  return AtprotoSession.parse(
    await fetch("https://bsky.social/xrpc/com.atproto.server.refreshSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshJwt}`,
      },
    }).then((res) => res.json()),
  );
};
