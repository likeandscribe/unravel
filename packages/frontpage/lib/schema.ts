import {
  text,
  pgTable,
  serial,
  integer,
  timestamp,
  bigint,
  unique,
  pgEnum,
  foreignKey,
  customType,
  varchar,
} from "drizzle-orm/pg-core";
import type { DID } from "./data/atproto/did";
import {
  MAX_COMMENT_LENGTH,
  MAX_POST_TITLE_LENGTH,
  MAX_POST_URL_LENGTH,
} from "./data/db/constants";

const did = customType<{ data: DID }>({
  dataType() {
    return "text";
  },
});

export const submissionStatus = pgEnum("submission_status", [
  "live",
  "deleted",
  "moderator_hidden",
]);

export const Post = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    rkey: text("rkey").notNull(),
    cid: text("cid").notNull().unique(),
    title: varchar("title", {
      length: MAX_POST_TITLE_LENGTH,
    }).notNull(),
    url: varchar("url", {
      length: MAX_POST_URL_LENGTH,
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorDid: did("author_did").notNull(),
    // TODO: add notNull once this is rolled out
    status: submissionStatus("status").default("live"),
  },
  (t) => ({
    unique_author_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const PostVote = pgTable(
  "post_votes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => Post.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorDid: did("author_did").notNull(),
    cid: text("cid").notNull().unique(),
    rkey: text("rkey").notNull(),
  },
  (t) => ({
    unique_authr_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const Comment = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    rkey: text("rkey").notNull(),
    cid: text("cid").notNull().unique(),
    postId: integer("post_id")
      .notNull()
      .references(() => Post.id),
    body: varchar("body", {
      length: MAX_COMMENT_LENGTH,
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorDid: did("author_did").notNull(),
    // TODO: add notNull once this is rolled out
    status: submissionStatus("status").default("live"),
    parentCommentId: integer("parent_comment_id"),
  },
  (t) => ({
    parentReference: foreignKey({
      columns: [t.parentCommentId],
      foreignColumns: [t.id],
      name: "parent_comment_id_fkey",
    }),
    unique_author_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const CommentVote = pgTable(
  "comment_votes",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => Comment.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorDid: did("author_did").notNull(),
    cid: text("cid").notNull().unique(),
    rkey: text("rkey").notNull(),
  },
  (t) => ({
    unique_authr_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const BetaUser = pgTable("beta_users", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  did: did("did").notNull().unique(),
});

export const ConsumedOffset = pgTable("consumed_offsets", {
  offset: bigint("offset", {
    mode: "bigint",
  }).primaryKey(),
});
