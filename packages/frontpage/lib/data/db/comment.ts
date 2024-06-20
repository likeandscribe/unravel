import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { eq, sql, count, desc, and } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { getUser } from "../user";

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

  const user = await getUser();

  const hasVoted = db
    .select({ commentId: schema.CommentVote.commentId })
    .from(schema.CommentVote)
    .where(user ? eq(schema.CommentVote.authorDid, user.did) : sql`false`)
    .as("hasVoted");

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
      userHasVoted: hasVoted.commentId,
    })
    .from(schema.Comment)
    .where(
      and(eq(schema.Comment.postId, postId), eq(schema.Comment.status, "live")),
    )
    .leftJoin(votes, eq(votes.commentId, schema.Comment.id))
    .leftJoin(hasVoted, eq(hasVoted.commentId, schema.Comment.id))
    .orderBy(desc(commentRank));

  return rows.map((row) => ({
    ...row,
    userHasVoted: row.userHasVoted !== null,
  }));
});

export async function uncached_doesCommentExist(rkey: string) {
  const row = await db
    .select({ id: schema.Comment.id })
    .from(schema.Comment)
    .where(eq(schema.Comment.rkey, rkey))
    .limit(1);

  return Boolean(row[0]);
}
