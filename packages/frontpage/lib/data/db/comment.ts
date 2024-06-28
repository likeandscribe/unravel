import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { eq, sql, count, desc, and } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { getUser } from "../user";
import { DID } from "../atproto/did";

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
      parentCommentId: schema.Comment.parentCommentId,
    })
    .from(schema.Comment)
    .where(
      and(eq(schema.Comment.postId, postId), eq(schema.Comment.status, "live")),
    )
    .leftJoin(votes, eq(votes.commentId, schema.Comment.id))
    .leftJoin(hasVoted, eq(hasVoted.commentId, schema.Comment.id))
    .orderBy(desc(commentRank));

  return nestCommentRows(
    rows.map((row) => ({
      ...row,
      userHasVoted: row.userHasVoted !== null,
    })),
  );
});

export const getCommentWithChildren = cache(
  async (postId: number, authorDid: DID, rkey: string) => {
    // We're currently fetching all rows from the database, this can be made more efficient later
    const comments = await getCommentsForPost(postId);

    return findCommentSubtree(comments, authorDid, rkey);
  },
);

type CommentRowWithChildren<
  T extends { id: number; parentCommentId: number | null },
> = T & {
  children: CommentRowWithChildren<T>[];
};

const nestCommentRows = <
  T extends { id: number; parentCommentId: number | null },
>(
  items: T[],
  id: number | null = null,
): CommentRowWithChildren<T>[] =>
  items
    .filter((item) => item.parentCommentId === id)
    .map((item) => ({
      ...item,
      children: nestCommentRows(items, item.id),
    }));

const findCommentSubtree = <
  T extends {
    id: number;
    parentCommentId: number | null;
    rkey: string;
    authorDid: DID;
  },
>(
  items: CommentRowWithChildren<T>[],
  authorDid: DID,
  rkey: string,
): CommentRowWithChildren<T> | null => {
  for (const item of items) {
    if (item.rkey === rkey && item.authorDid === authorDid) {
      return item;
    }

    const child = findCommentSubtree(item.children, authorDid, rkey);
    if (child) {
      return child;
    }
  }

  return null;
};

export const getComment = cache(async (rkey: string) => {
  const rows = await db
    .select()
    .from(schema.Comment)
    .where(eq(schema.Comment.rkey, rkey))
    .limit(1);

  return rows[0] ?? null;
});

export async function uncached_doesCommentExist(rkey: string) {
  const row = await db
    .select({ id: schema.Comment.id })
    .from(schema.Comment)
    .where(eq(schema.Comment.rkey, rkey))
    .limit(1);

  return Boolean(row[0]);
}
