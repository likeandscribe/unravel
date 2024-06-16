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
  if (!uri) {
    throw new CreatePostError(`Failed to parse AtUri: "${result.uri}"`);
  }
  return {
    rkey: uri.rkey,
  };
}

export function parseAtUri(uri: string): {
  authority: string;
  collection: string | null;
  rkey: string | null;
} | null {
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
      voteCount: sql`coalesce(${votesSubQuery.voteCount}, 0) + 1`
        .mapWith(Number)
        .as("voteCount"),
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

export async function uncached_doesPostExist(rkey: string) {
  const row = await db
    .select({ id: schema.Post.id })
    .from(schema.Post)
    .where(eq(schema.Post.rkey, rkey))
    .limit(1);

  return Boolean(row[0]);
}

export const PostRecord = z.object({
  title: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

/**
 * Returns null if there is no logged in user or the record isn't found
 */
export const getPostFromUserPds = cache(async (rkey: string) => {
  const user = await getUser();
  if (!user) return null;
  const pdsUrl = await getPdsUrl(user.did);
  if (!pdsUrl) {
    return null;
  }

  const record = await atprotoGetRecord({
    serviceEndpoint: pdsUrl,
    repo: user.did,
    collection: "fyi.unravel.frontpage.post",
    rkey,
  });

  return PostRecord.parse(record.value);
});

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
    coalesce(${votes.voteCount} / (
    -- Age
      (
        EXTRACT(
          EPOCH
          FROM
            (CURRENT_TIMESTAMP - ${schema.Comment.createdAt})
        ) / 3600
      ) + 2
    ) ^ 1.8, 0)
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
  content: string;
  subjectRkey: string;
};

export async function createComment({ subjectRkey, content }: CommentInput) {
  await ensureIsInBeta();
  const user = await ensureUser();
  const post = await getPost(subjectRkey);

  if (!post) {
    throw new Error("Post not found");
  }

  await atprotoCreateRecord({
    record: {
      content,
      subject: {
        cid: post.cid,
        uri: `at://${user.did}/fyi.unravel.frontpage.post/${subjectRkey}`,
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
