import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";
import { eq, sql, count, desc } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { getUser } from "../user";

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
      status: schema.Post.status,
    })
    .from(schema.Post)
    .leftJoin(comments, eq(comments.postId, schema.Post.id))
    .leftJoin(votesSubQuery, eq(votesSubQuery.postId, schema.Post.id))
    .leftJoin(userHasVoted, eq(userHasVoted.postId, schema.Post.id))
    .where(eq(schema.Post.status, "live"))
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
