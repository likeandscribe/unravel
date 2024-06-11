import NextAuth, { DefaultSession, NextAuthResult } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

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
      authorize: async (credentials) => {
        console.log("authorizing...");
        const session = await atprotoCreateSession(
          Credentials.parse(credentials),
        );

        return {
          id: session.did,
          refreshJwt: session.refreshJwt,
          accessJwt: session.accessJwt,
        };
      },
    }),
  ],
});

export const signIn = async (formData: FormData) => {
  await auth.signIn("credentials", formData);
};
export const signOut = async () => {
  await auth.signOut();
};
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

async function atProtoGetSession(accessJwt: string) {
  return AtprotoSession.parse(
    await fetch(
      "https://public.api.bsky.app/xrpc/com.atproto.server.getSession",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessJwt}`,
        },
      },
    ).then((res) => res.json()),
  );
}
