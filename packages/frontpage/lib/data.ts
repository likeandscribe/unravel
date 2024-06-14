import "server-only";
import { cache } from "react";
import { getSession } from "./auth";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { db } from "./db";
import { eq, sql, count, desc, SQL } from "drizzle-orm";
import * as schema from "./schema";
import { z } from "zod";

/**
 * Returns null when not logged in. If you want to ensure that the user is logged in, use `ensureUser` instead.
 */
export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    return null;
  }

  if (!session.user) {
    throw new Error("Invalid session");
  }

  const token = decodeJwt(session.user.accessJwt);

  if (!token.sub) {
    throw new Error("Invalid token. Missing sub");
  }

  const pdsUrl = await getPdsUrl(token.sub);
  if (!pdsUrl) {
    throw new Error("No AtprotoPersonalDataServer service found");
  }

  return {
    handle: session.user.name,
    pdsUrl,
    did: token.sub,
    accessJwt: session.user.accessJwt,
  };
});

export async function ensureUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

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
  const user = await ensureUser();
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

type DeleteRecordInput = {
  collection: string;
  rkey: string;
};

async function atprotoDeleteRecord({ collection, rkey }: DeleteRecordInput) {
  const user = await ensureUser();
  const pdsUrl = new URL(user.pdsUrl);
  pdsUrl.pathname = "/xrpc/com.atproto.repo.deleteRecord";

  const response = await fetch(pdsUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.accessJwt}`,
    },
    body: JSON.stringify({
      repo: user.did,
      collection,
      rkey,
    }),
  });

  if (!response.ok) {
    throw new PdsError("Failed to create post", { cause: response });
  }
}

export const isBetaUser = cache(async () => {
  const user = await getUser();
  if (!user) {
    return false;
  }

  return Boolean(
    await db.query.BetaUser.findFirst({
      where: eq(schema.BetaUser.did, user.did),
    }),
  );
});

export const ensureIsInBeta = cache(async () => {
  const user = await ensureUser();

  if (
    await db.query.BetaUser.findFirst({
      where: eq(schema.BetaUser.did, user.did),
    })
  ) {
    return;
  }

  redirect("/invite-only");
});

export const getPlcDoc = cache(async (did: string) => {
  const response = await fetch(`https://plc.directory/${did}`, {
    next: {
      // TODO: Also revalidate this when we receive an identity change event
      // That would allow us to extend the revalidation time to 1 day
      revalidate: 60 * 60, // 1 hour
    },
  });

  return PlcDocument.parse(await response.json());
});

const PlcDocument = z.object({
  id: z.string(),
  alsoKnownAs: z.array(z.string()),
  service: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      serviceEndpoint: z.string(),
    }),
  ),
});

export const getPdsUrl = cache(async (did: string) => {
  const plc = await getPlcDoc(did);

  return (
    plc.service.find((s) => s.type === "AtprotoPersonalDataServer")
      ?.serviceEndpoint ?? null
  );
});

const votesSubQuery = db
  .select({
    postId: schema.PostVote.postId,
    voteCount: count(schema.PostVote.id).as("voteCount"),
  })
  .from(schema.PostVote)
  .groupBy(schema.PostVote.postId)
  .as("vote");

export const getFrontpagePosts = cache(async () => {
  const comments = db
    .select({
      postId: schema.Comment.postId,
      commentCount: count(schema.Comment.id).as("commentCount"),
    })
    .from(schema.Comment)
    .groupBy(schema.Comment.postId)
    .as("comment");

  // This ranking is very naive. I believe it'll need to consider every row in the table even if you limit the results.
  // We should closely monitor this and consider alternatives if it gets slow over time
  const rank = sql`
    coalesce(${votesSubQuery.voteCount} / (
    -- Age
      (
        EXTRACT(
          EPOCH
          FROM
            (CURRENT_TIMESTAMP - ${schema.Post.createdAt})
        ) / 3600
      ) + 2
    ) ^ 1.8, 0)
  `.as("rank");

  const rows = await db
    .select({
      id: schema.Post.id,
      rkey: schema.Post.rkey,
      cid: schema.Post.cid,
      title: schema.Post.title,
      url: schema.Post.url,
      createdAt: schema.Post.createdAt,
      authorDid: schema.Post.authorDid,
      // +1 to include the author's vote
      voteCount: sql`coalesce(${votesSubQuery.voteCount}, 0) + 1`.as(
        "voteCount",
      ),
      commentCount: comments.commentCount,
      rank: rank,
    })
    .from(schema.Post)
    .leftJoin(comments, eq(comments.postId, schema.Post.id))
    .leftJoin(votesSubQuery, eq(votesSubQuery.postId, schema.Post.id))
    .orderBy(desc(rank));

  return rows.map((row) => ({
    id: row.id,
    rkey: row.rkey,
    cid: row.cid,
    title: row.title,
    url: row.url,
    createdAt: row.createdAt,
    authorDid: row.authorDid,
    voteCount: row.voteCount ?? 0,
    commentCount: row.commentCount ?? 0,
  }));
});

export const getPost = cache(async (rkey: string) => {
  const comments = db
    .select({
      postId: schema.Comment.postId,
      commentCount: count(schema.Comment.id).as("commentCount"),
    })
    .from(schema.Comment)
    .groupBy(schema.Comment.postId)
    .as("comment");

  const rows = await db
    .select()
    .from(schema.Post)
    .where(eq(schema.Post.rkey, rkey))
    .leftJoin(comments, eq(comments.postId, schema.Post.id))
    .leftJoin(votesSubQuery, eq(votesSubQuery.postId, schema.Post.id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row.posts,
    commentCount: row.comment?.commentCount ?? 0,
    // +1 to include the author's vote
    voteCount: (row.vote?.voteCount ?? 0) + 1,
  };
});

export async function deletePost(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: "fyi.unravel.frontpage.post",
  });
}
