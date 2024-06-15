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
      } else if (Date.now() + 500 < (token.expiresAt as any as number)) {
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

//eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiNG9FbmRXZzhTZG40QXd6VGwyeERKWUw5Z2s2TWl4VXFDUTZYZ2dWSV9wWW0takR0YnJERG54THFUdnlRZ3BCOHQydlJZLUxlcWtYb0xlVmhuQzhRbHcifQ..yvYGAknLeBZKgWYHHligNw.IghvJH6KwxDb3Sh0SK-DTCUbWJxreVk8LFQmzmWOwPmVawo70ZqcKBKHC3XGw5fEK2LJf2plNDF6Tox4-5pHcNYkgrPUhORnIgnKJvv-u8VXPxBLyaC1E15SgcVSY3WAEFTK4l-LNNVGbzQHyWq2ZB9g1MDqRhUNZKEtGBcbyhVlgCd5sM52Iph2oHuFVd2tJimQHJOiQw8uAKTfIpCaF3fpf6dnki7R1VC1M59T8tmUbNntTa3SBVo5EdRS9Gt6hbCvTJ-JE3oxAQDr7STwUoRv2aHp0wzKDwquYS_ZsNmTXKN_QWsTQ3PRKfdTh2AagGvAmLjBeMmw-WsxqxCym1LRy8jdWC8rC8N3j7wwMtvdeSTlJ8KeYKZk6Ui5VffvT9YPWVPts7XxJ7UQz6ZyEXQg0JZ4TNOSbyRmor4Zt5WUWHljOxmQmURDlUJiIuIPeqZf8eOOp9L_lHlFrCHYMSX53yQ9DYZ9sSFDPlsPSD2JnbXVABIvnTMTDfzsaMukfKaZgfD__jC7DJHMHAfF1BCYSXmTGbMHId7kiJ_0EofcmlVqQuU5UTIsqiFbkD-W7bTm2rEdqljJJopzSAI8fsV5eE_rliW9ysujplBGLdAgS3Qa8xIlDF9UWmdya0_fyBYiUMzm8pyvgvSaqEJn14_OLVFXJ9vITq8-M_BHYJdXIRqDur9HVdMSxVTLqmUZbmnZubpmsrzD1bMq08aF98wijTxxMqnoQrids_B9w0ZJcVQJSSQQRiHLJq-gB-Ghh79_sdzd5h3xoAlKnt27MDoJe7IE-YIo4KIgqAPLzmshCzzHYf5k4X77h9IPVU7TAKfsvkxPr3JKznrx46iPuscW0_8DOCfKWoOVkjODa9GVUrNs-85fYNqsdcrPW3gXkyvvHQCiHVp0fqT4ti3KowiYDkHRFmKKzaTmIMj56UMDe9ycOSRn_poWFi225UGUdOH0_PRTQAAEqxuTCiQw_O81qUxWUWB5WmMuDQFXIVbaivpa2qJyNLPbX46PVvIM6jqNKcht_f_lhmb9z8vmzkmj8rQzqJflm16524LhddA8jT4PJjFNJamPSWnCHRmAfr_0lhrYzfb1ytJx07D7QCHNyPGMdj161K3nlkF3Ox7S_Pfw5EJ71UrJOpb3Fp9-ujBZE2F7jR0j3M2RDtQRE9TSShfUMIGmEX2mS_EESz3ZSYN1eYbKB2w-AlcK8gUwmFhNOv-3MnR-w8rbqxkVqQ.UJ-YDiL5MEncEB1ra6KmF6sfUihBbUTPmihL510jlMs
