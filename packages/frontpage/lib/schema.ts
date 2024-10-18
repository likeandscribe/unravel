import {
  sqliteTable,
  text,
  integer,
  customType,
  unique,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import type { DID } from "./data/atproto/did";
import {
  MAX_COMMENT_LENGTH,
  MAX_POST_TITLE_LENGTH,
  MAX_POST_URL_LENGTH,
} from "./data/db/constants";
import { sql } from "drizzle-orm";

const did = customType<{ data: DID }>({
  dataType() {
    return "text";
  },
});

const dateIsoText = customType<{ data: Date; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver: (value) => value.toISOString(),
  fromDriver: (value) => new Date(value),
});

const createStatusColumn = (col: string) =>
  text(col, { enum: ["live", "deleted", "moderator_hidden"] }).default("live");

export const Post = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey(),
    rkey: text("rkey").notNull(),
    cid: text("cid").notNull().unique(),
    title: text("title", {
      length: MAX_POST_TITLE_LENGTH,
    }).notNull(),
    url: text("url", {
      length: MAX_POST_URL_LENGTH,
    }).notNull(),
    createdAt: dateIsoText("created_at").notNull(),
    authorDid: did("author_did").notNull(),
    // TODO: add notNull once this is rolled out
    status: createStatusColumn("status"),
  },
  (t) => ({
    unique_author_rkey: unique().on(t.authorDid, t.rkey),
  }),
);

export const PostVote = sqliteTable(
  "post_votes",
  {
    id: integer("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => Post.id),
    createdAt: dateIsoText("created_at").notNull(),
    authorDid: did("author_did").notNull(),
    cid: text("cid").notNull().unique(),
    rkey: text("rkey").notNull(),
  },
  (t) => ({
    unique_authr_rkey: unique().on(t.authorDid, t.rkey),
    // Ensures you can only vote once per post
    unique_author_postId: unique().on(t.authorDid, t.postId),
  }),
);

export const Comment = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey(),
    rkey: text("rkey").notNull(),
    cid: text("cid").notNull().unique(),
    postId: integer("post_id")
      .notNull()
      .references(() => Post.id),
    body: text("body", {
      length: MAX_COMMENT_LENGTH,
    }).notNull(),
    createdAt: dateIsoText("created_at").notNull(),
    authorDid: did("author_did").notNull(),
    // TODO: add notNull once this is rolled out
    status: createStatusColumn("status"),
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

export const CommentVote = sqliteTable(
  "comment_votes",
  {
    id: integer("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => Comment.id),
    createdAt: dateIsoText("created_at").notNull(),
    authorDid: did("author_did").notNull(),
    cid: text("cid").notNull().unique(),
    rkey: text("rkey").notNull(),
  },
  (t) => ({
    unique_authr_rkey: unique().on(t.authorDid, t.rkey),
    // Ensures you can only vote once per post
    unique_author_commentId: unique().on(t.authorDid, t.commentId),
  }),
);

/**
 * @deprecated
 */
export const BetaUser = sqliteTable("beta_users", {
  id: integer("id").primaryKey(),
  createdAt: dateIsoText("created_at").notNull(),
  did: did("did").notNull().unique(),
});

export const AdminUser = sqliteTable("admin_users", {
  id: integer("id").primaryKey(),
  createdAt: dateIsoText("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  did: did("did").notNull().unique(),
});

export const ConsumedOffset = sqliteTable("consumed_offsets", {
  offset: integer("offset").primaryKey(),
});

export const OauthAuthRequest = sqliteTable("oauth_auth_requests", {
  state: text("state").notNull().unique(),
  iss: text("iss").notNull(),
  did: did("did").notNull(),
  username: text("username").notNull(),
  nonce: text("nonce").notNull(),
  pkceVerifier: text("pkce_verifier").notNull(),
  dpopPrivateJwk: text("dpop_private_jwk").notNull(),
  dpopPublicJwk: text("dpop_public_jwk").notNull(),
  expiresAt: dateIsoText("expires_at").notNull(),
  createdAt: dateIsoText("created_at").notNull(),
});

export const OauthSession = sqliteTable("oauth_sessions", {
  sessionId: integer("id").primaryKey(),
  did: did("did").notNull(),
  username: text("username").notNull(),
  iss: text("iss").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  dpopNonce: text("dpop_nonce").notNull(),
  dpopPrivateJwk: text("dpop_private_jwk").notNull(),
  dpopPublicJwk: text("dpop_public_jwk").notNull(),
  expiresAt: dateIsoText("expires_at").notNull(),
  createdAt: dateIsoText("created_at").notNull(),
});

export const ModerationEvent = sqliteTable("moderation_events", {
  id: integer("id").primaryKey(),
  subjectUri: text("subject_uri").notNull(),
  subjectDid: text("subject_did").notNull(),
  subjectCollection: text("subject_collection"),
  subjectRkey: text("subject_rkey"),
  subjectCid: text("subject_cid"),
  createdBy: text("created_by").notNull(),
  createdAt: dateIsoText("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  labelsAdded: text("labels_added"),
  labelsRemoved: text("labels_removed"),
  creatorReportReason: text("report_type"),
});

export const LabelledProfile = sqliteTable("labelled_profiles", {
  id: integer("id").primaryKey(),
  did: text("did").notNull().unique(),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
  labels: text("labels"),
  createdAt: dateIsoText("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: dateIsoText("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const Report = sqliteTable("reports", {
  id: integer("id").primaryKey(),
  actionedAt: dateIsoText("actioned_at"),
  actionedBy: text("actioned_by"),
  subjectUri: text("subject_uri").notNull(),
  subjectDid: text("subject_did").notNull(),
  subjectCollection: text("subject_collection"),
  subjectRkey: text("subject_rkey"),
  subjectCid: text("subject_cid"),
  createdBy: text("created_by").notNull(),
  createdAt: dateIsoText("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  creatorComment: text("creator_comment"),
  reportReason: text("report_reason"),
  status: text("status", {
    enum: ["pending", "accepted", "rejected"],
  }).default("pending"),
});

export const Notification = sqliteTable("notifications", {
  id: integer("id").primaryKey(),
  did: did("did").notNull(),
  createdAt: dateIsoText("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  readAt: dateIsoText("read_at"),
  reason: text("reason", { enum: ["postComment", "commentReply"] }).notNull(),
  postId: integer("post_id").references(() => Post.id),
  commentId: integer("comment_id").references(() => Comment.id),
});
