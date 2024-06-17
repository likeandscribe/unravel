import {
  text,
  pgTable,
  serial,
  integer,
  timestamp,
  bigint,
  unique,
} from "drizzle-orm/pg-core";

export const Post = pgTable("posts", {
  id: serial("id").primaryKey(),
  rkey: text("rkey").notNull().unique(),
  cid: text("cid").notNull().unique(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorDid: text("author_did").notNull(),
});

export const PostVote = pgTable(
  "post_votes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => Post.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorDid: text("author_did").notNull(),
    cid: text("cid").notNull().unique(),
    rkey: text("rkey").notNull().unique(),
  },
  (t) => ({
    unique_authr_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const Comment = pgTable("comments", {
  id: serial("id").primaryKey(),
  rkey: text("rkey").notNull().unique(),
  cid: text("cid").notNull().unique(),
  postId: integer("post_id")
    .notNull()
    .references(() => Post.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorDid: text("author_did").notNull(),
});

export const CommentVote = pgTable(
  "comment_votes",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => Comment.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorDid: text("author_did").notNull(),
    cid: text("cid").notNull().unique(),
    rkey: text("rkey").notNull().unique(),
  },
  (t) => ({
    unique_authr_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const BetaUser = pgTable("beta_users", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  did: text("did").notNull().unique(),
});

export const ConsumedOffset = pgTable("consumed_offsets", {
  offset: bigint("offset", {
    mode: "bigint",
  }).primaryKey(),
});
