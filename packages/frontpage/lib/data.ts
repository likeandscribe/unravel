import "server-only";
import { cache } from "react";
import { getSession } from "./auth";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { BetaUser } from "./schema";

export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!session.user) {
    throw new Error("Invalid session");
  }

  const token = decodeJwt(session.user.accessJwt);
  if (typeof token.aud !== "string") {
    throw new Error("Invalid token");
  }

  return {
    handle: session.user.name,
    pdsUrl: `https://${token.aud.replace(/^did:web:/, "")}`,
    did: token.sub,
    accessJwt: session.user.accessJwt,
  };
});

type PostInput = {
  title: string;
  url: string;
};

export class PdsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export async function createPost({ title, url }: PostInput) {
  await ensureIsInBeta();

  await atprotoCreateRecord({
    record: { title, url, createdAt: new Date().toISOString() },
    collection: "fyi.unravel.frontpage.post",
  });
}

type CreateRecordInput = {
  record: unknown;
  collection: string;
};

async function atprotoCreateRecord({ record, collection }: CreateRecordInput) {
  const user = await getUser();
  const pdsUrl = new URL(user.pdsUrl);
  pdsUrl.pathname = "/xrpc/com.atproto.repo.createRecord";

  const response = await fetch(pdsUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.accessJwt}`,
    },
    body: JSON.stringify({
      repo: user.did,
      collection,
      validate: false,
      record: record,
    }),
  });

  if (!response.ok) {
    throw new PdsError("Failed to create post", { cause: response });
  }
}

export const ensureIsInBeta = cache(async () => {
  const user = await getUser();
  if (!user.did) throw new Error("Invalid user");

  if (
    await db.query.BetaUser.findFirst({ where: eq(BetaUser.did, user.did) })
  ) {
    return;
  }

  redirect("/invite-only");
});
