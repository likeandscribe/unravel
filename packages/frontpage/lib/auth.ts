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
    jwt: async ({ token, user }) => {
      if (user) {
        const refreshJwt = (user as any).refreshJwt;
        const accessJwt = (user as any).accessJwt;
        const refresh = decodeJwt(refreshJwt);
        token.exp = refresh.exp;
        token.sub = refresh.sub;
        token.refreshJwt = refreshJwt;
        token.accessJwt = accessJwt;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.refreshJwt = token.refreshJwt as any;
      session.user.accessJwt = token.accessJwt as any;
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
  email: z.string().optional(),
});

const atprotoCreateSession = cache(
  async ({ identifier, password }: z.infer<typeof Credentials>) => {
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
  },
);
