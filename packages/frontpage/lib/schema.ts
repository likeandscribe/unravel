import "server-only";
import { text, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const Post = pgTable("posts", {
  id: serial("id").primaryKey(),
  cid: text("cid").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorDid: text("author_did").notNull(),
});

export const PostVote = pgTable("post_votes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => Post.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorDid: text("author_did").notNull(),
});

export const Comment = pgTable("comments", {
  id: serial("id").primaryKey(),
  cid: text("cid").notNull(),
  postId: integer("post_id")
    .notNull()
    .references(() => Post.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorDid: text("author_did").notNull(),
});

export const CommentVote = pgTable("comment_votes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .notNull()
    .references(() => Comment.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorDid: text("author_did").notNull(),
});