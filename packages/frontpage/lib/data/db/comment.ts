import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { eq, sql, count, desc, and, InferSelectModel } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { getUser } from "../user";
import { DID } from "../atproto/did";
import { Prettify } from "@/lib/utils";

type CommentRow = InferSelectModel<typeof schema.Comment>;

type CommentExtras = {
  children?: CommentModel[];
  userHasVoted: boolean;
  rank?: number;
  voteCount: number;
  postAuthorDid?: DID;
  postRkey?: string;
};

type LiveComment = CommentRow & CommentExtras & { status: "live" };

type HiddenComment = Omit<CommentRow, "status" | "body"> &
  CommentExtras & {
    status: Exclude<CommentRow["status"], "live">;
    body: null;
  };

export type CommentModel = Prettify<LiveComment | HiddenComment>;

const buildUserHasVotedQuery = cache(async () => {
  const user = await getUser();

  return db
    .select({ commentId: schema.CommentVote.commentId })
    .from(schema.CommentVote)
    .where(user ? eq(schema.CommentVote.authorDid, user.did) : sql`false`)
    .as("hasVoted");
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
  `
    .mapWith(Number)
    .as("rank");

  const hasVoted = await buildUserHasVotedQuery();

  const rows = await db
    .select({
      id: schema.Comment.id,
      rkey: schema.Comment.rkey,
      cid: schema.Comment.cid,
      postId: schema.Comment.postId,
      body: schema.Comment.body,
      createdAt: schema.Comment.createdAt,
      authorDid: schema.Comment.authorDid,
      status: schema.Comment.status,
      voteCount: sql`coalesce(${votes.voteCount}, 0) + 1`
        .mapWith(Number)
        .as("voteCount"),
      rank: commentRank,
      userHasVoted: hasVoted.commentId,
      parentCommentId: schema.Comment.parentCommentId,
    })
    .from(schema.Comment)
    .where(eq(schema.Comment.postId, postId))
    .leftJoin(votes, eq(votes.commentId, schema.Comment.id))
    .leftJoin(hasVoted, eq(hasVoted.commentId, schema.Comment.id))
    .orderBy(desc(commentRank));

  return nestCommentRows(rows);
});

export const getCommentWithChildren = cache(
  async (postId: number, authorDid: DID, rkey: string) => {
    // We're currently fetching all rows from the database, this can be made more efficient later
    const comments = await getCommentsForPost(postId);

    return findCommentSubtree(comments, authorDid, rkey);
  },
);

const nestCommentRows = (
  items: (CommentRow & {
    userHasVoted?: number | null;
    voteCount?: number;
    rank?: number;
  })[],
  id: number | null = null,
): CommentModel[] => {
  const comments: CommentModel[] = [];

  for (const item of items) {
    if (item.parentCommentId !== id) {
      continue;
    }

    const children = nestCommentRows(items, item.id);
    const transformed = {
      userHasVoted: item.userHasVoted !== null,
      voteCount: item.voteCount ?? 0,
    };
    if (item.status === "live") {
      comments.push({
        ...item,
        ...transformed,
        // Explicit copy is required to avoid TS error
        status: item.status,
        children,
      });
    } else {
      comments.push({
        ...item,
        ...transformed,
        // Explicit copy is required to avoid TS error
        status: item.status,
        body: null,
        children,
      });
    }
  }

  return comments;
};

const findCommentSubtree = (
  items: CommentModel[],
  authorDid: DID,
  rkey: string,
): CommentModel | null => {
  for (const item of items) {
    if (item.rkey === rkey && item.authorDid === authorDid) {
      return item;
    }

    if (!item.children) return null;

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

export const getUserComments = cache(async (userDid: DID) => {
  const hasVoted = await buildUserHasVotedQuery();
  const comments = await db
    .select({
      id: schema.Comment.id,
      rkey: schema.Comment.rkey,
      cid: schema.Comment.cid,
      postId: schema.Comment.postId,
      body: schema.Comment.body,
      createdAt: schema.Comment.createdAt,
      authorDid: schema.Comment.authorDid,
      status: schema.Comment.status,
      postRkey: schema.Post.rkey,
      postAuthorDid: schema.Post.authorDid,
      parentCommentId: schema.Comment.parentCommentId,
      userHasVoted: hasVoted.commentId,
    })
    .from(schema.Comment)
    .where(
      and(
        eq(schema.Comment.authorDid, userDid),
        eq(schema.Comment.status, "live"),
      ),
    )
    .leftJoin(schema.Post, eq(schema.Comment.postId, schema.Post.id))
    .leftJoin(hasVoted, eq(hasVoted.commentId, schema.Comment.id));

  return nestCommentRows(comments);
});

export function shouldHideComment(comment: CommentModel) {
  return (
    comment.status !== "live" &&
    comment.children &&
    comment.children.length === 0
  );
}
