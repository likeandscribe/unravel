import "server-only";
import { cache } from "react";
import { getSession } from "./auth";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { db } from "./db";
import { eq, sql, count, desc, SQL, and } from "drizzle-orm";
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

export class CreatePostError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export async function createPost({ title, url }: PostInput) {
  await ensureIsInBeta();

  const result = await atprotoCreateRecord({
    record: { title, url, createdAt: new Date().toISOString() },
    collection: "fyi.unravel.frontpage.post",
  });

  const uri = parseAtUri(result.uri);
  if (!uri || !uri.rkey) {
    throw new CreatePostError(`Failed to parse AtUri: "${result.uri}"`);
  }
  return {
    rkey: uri.rkey,
  };
}

export function parseAtUri(uri: string) {
  const match = uri.match(/^at:\/\/(.+?)(\/.+?)?(\/.+?)?$/);
  if (!match) return null;
  const [, authority, collection, rkey] = match;
  if (!authority || !collection || !rkey) return null;
  return {
    authority,
    collection: collection.replace("/", ""),
    rkey: rkey.replace("/", ""),
  };
}

const CreateRecordResponse = z.object({
  uri: z.string(),
  cid: z.string(),
});

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
    throw new CreatePostError("Failed to create post", { cause: response });
  }

  return CreateRecordResponse.parse(await response.json());
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
    throw new CreatePostError("Failed to create post", { cause: response });
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
    voteCount: sql`coalesce(${count(schema.PostVote.id)}, 1)`
      .mapWith(Number)
      .as("voteCount"),
  })
  .from(schema.PostVote)
  .groupBy(schema.PostVote.postId)
  .as("vote");

const buildUserHasVotedQuery = cache(async () => {
  const user = await getUser();

  return db
    .select({ postId: schema.PostVote.postId })
    .from(schema.PostVote)
    .where(user ? eq(schema.PostVote.authorDid, user.did) : sql`false`)
    .as("hasVoted");
});

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
    coalesce(${votesSubQuery.voteCount}, 1) / (
    -- Age
      (
        EXTRACT(
          EPOCH
          FROM
            (CURRENT_TIMESTAMP - ${schema.Post.createdAt})
        ) / 3600
      ) + 2
    ) ^ 1.8
  `.as("rank");

  const userHasVoted = await buildUserHasVotedQuery();

  const rows = await db
    .select({
      id: schema.Post.id,
      rkey: schema.Post.rkey,
      cid: schema.Post.cid,
      title: schema.Post.title,
      url: schema.Post.url,
      createdAt: schema.Post.createdAt,
      authorDid: schema.Post.authorDid,
      voteCount: votesSubQuery.voteCount,
      commentCount: comments.commentCount,
      rank: rank,
      userHasVoted: userHasVoted.postId,
    })
    .from(schema.Post)
    .leftJoin(comments, eq(comments.postId, schema.Post.id))
    .leftJoin(votesSubQuery, eq(votesSubQuery.postId, schema.Post.id))
    .leftJoin(userHasVoted, eq(userHasVoted.postId, schema.Post.id))
    .orderBy(desc(rank));

  return rows.map((row) => ({
    id: row.id,
    rkey: row.rkey,
    cid: row.cid,
    title: row.title,
    url: row.url,
    createdAt: row.createdAt,
    authorDid: row.authorDid,
    voteCount: row.voteCount ?? 1,
    commentCount: row.commentCount ?? 0,
    userHasVoted: Boolean(row.userHasVoted),
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

  const userHasVoted = await buildUserHasVotedQuery();

  const rows = await db
    .select()
    .from(schema.Post)
    .where(eq(schema.Post.rkey, rkey))
    .leftJoin(comments, eq(comments.postId, schema.Post.id))
    .leftJoin(votesSubQuery, eq(votesSubQuery.postId, schema.Post.id))
    .leftJoin(userHasVoted, eq(userHasVoted.postId, schema.Post.id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row.posts,
    commentCount: row.comment?.commentCount ?? 0,
    voteCount: row.vote?.voteCount ?? 1,
    userHasVoted: Boolean(row.hasVoted),
  };
});

export async function uncached_doesPostExist(rkey: string) {
  const row = await db
    .select({ id: schema.Post.id })
    .from(schema.Post)
    .where(eq(schema.Post.rkey, rkey))
    .limit(1);

  return Boolean(row[0]);
}

export const getCommentsForPost = cache(async (postId: number) => {
  const votes = db
    .select({
      commentId: schema.CommentVote.commentId,
      voteCount: count(schema.CommentVote.id).as("voteCount"),
    })
    .from(schema.CommentVote)
    .groupBy(schema.CommentVote.commentId)
    .as("vote");

  const commentRank = sql`
    coalesce(${votes.voteCount}, 1) / (
    -- Age
      (
        EXTRACT(
          EPOCH
          FROM
            (CURRENT_TIMESTAMP - ${schema.Comment.createdAt})
        ) / 3600
      ) + 2
    ) ^ 1.8
  `.as("rank");

  const rows = await db
    .select({
      id: schema.Comment.id,
      rkey: schema.Comment.rkey,
      cid: schema.Comment.cid,
      postId: schema.Comment.postId,
      body: schema.Comment.body,
      createdAt: schema.Comment.createdAt,
      authorDid: schema.Comment.authorDid,
      voteCount: sql`coalesce(${votes.voteCount}, 0) + 1`
        .mapWith(Number)
        .as("voteCount"),
      rank: commentRank,
    })
    .from(schema.Comment)
    .where(eq(schema.Comment.postId, postId))
    .leftJoin(votes, eq(votes.commentId, schema.Comment.id))
    .orderBy(desc(commentRank));

  return rows;
});

export async function deletePost(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: "fyi.unravel.frontpage.post",
  });
}

type CommentInput = {
  subjectRkey: string;
  subjectCid: string;
  subjectCollection: string;
  content: string;
};

export async function createComment({
  subjectRkey,
  subjectCid,
  subjectCollection,
  content,
}: CommentInput) {
  await ensureIsInBeta();
  const user = await ensureUser();

  await atprotoCreateRecord({
    record: {
      content,
      subject: {
        cid: subjectCid,
        uri: `at://${user.did}/${subjectCollection}/${subjectRkey}`,
      },
      createdAt: new Date().toISOString(),
    },
    collection: "fyi.unravel.frontpage.comment",
  });
}

const AtProtoRecord = z.object({
  value: z.custom<unknown>(
    (value) => typeof value === "object" && value != null,
  ),
  cid: z.string(),
});

type GetRecordInput = {
  serviceEndpoint: string;
  repo: string;
  collection: string;
  rkey: string;
};

export async function atprotoGetRecord({
  serviceEndpoint,
  repo,
  collection,
  rkey,
}: GetRecordInput) {
  const url = new URL(`${serviceEndpoint}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.append("repo", repo);
  url.searchParams.append("collection", collection);
  url.searchParams.append("rkey", rkey);

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok)
    throw new Error("Failed to fetch record", { cause: response });

  const json = await response.json();

  return AtProtoRecord.parse(json);
}

type VoteInput = {
  subjectRkey: string;
  subjectCid: string;
  subjectCollection: string;
};

export async function createVote({
  subjectRkey,
  subjectCid,
  subjectCollection,
}: VoteInput) {
  const user = await ensureUser();
  await ensureIsInBeta();
  const uri = `at://${user.did}/${subjectCollection}/${subjectRkey}`;

  await atprotoCreateRecord({
    collection: "fyi.unravel.frontpage.vote",
    record: {
      createdAt: new Date().toISOString(),
      subject: {
        cid: subjectCid,
        uri,
      },
    },
  });
}

export async function deleteVote(rkey: string) {
  await ensureUser();
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    collection: "fyi.unravel.frontpage.vote",
    rkey,
  });
}

export async function getVoteForPost(postId: number) {
  const user = await getUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(schema.PostVote)
    .where(
      and(
        eq(schema.PostVote.authorDid, user.did),
        eq(schema.PostVote.postId, postId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
