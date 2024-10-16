import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import {
  and,
  eq,
  lt,
  desc,
  isNull,
  count,
  ExtractTablesWithRelations,
} from "drizzle-orm";
import { getCommentsFromCids } from "./comment";
import { getPostsFromCids } from "./post";
import { invariant } from "@/lib/utils";
import { ensureUser } from "../user";
import { DID } from "../atproto/did";
import { AtUri } from "../atproto/uri";
import { z } from "zod";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { ResultSet } from "@libsql/client";

declare const tag: unique symbol;
export type Cursor = { readonly [tag]: "Cursor" };

function cursorToDate(cursor: Cursor): Date {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Date(cursor as any);
}

function createCursor(date: Date): Cursor {
  return date.toString() as unknown as Cursor;
}

export const getNotifications = cache(
  async (limit: number, cursor: Cursor | null) => {
    const user = await ensureUser();

    const notifications = await db
      .select()
      .from(schema.Notification)
      .where(
        and(
          eq(schema.Notification.did, user.did),
          cursor
            ? lt(schema.Notification.createdAt, cursorToDate(cursor))
            : undefined,
        ),
      )
      .orderBy(desc(schema.Notification.createdAt))
      .limit(limit);

    const postCids: string[] = [];
    const commentCids: string[] = [];
    for (const notification of notifications) {
      if (notification.reason === "postComment") {
        postCids.push(notification.reasonCid);
      }
      if (notification.reason === "commentReply") {
        commentCids.push(notification.reasonCid);
      }
    }

    const [posts, comments] = await Promise.all([
      getPostsFromCids(postCids),
      getCommentsFromCids(commentCids),
    ]);

    const newCursor =
      notifications.length > 0
        ? createCursor(notifications.at(-1)!.createdAt)
        : null;

    return {
      cursor: newCursor,
      notifications: notifications.map((notification) => {
        const sharedAttributes = {
          createdAt: notification.createdAt,
          read: !!notification.readAt,
          id: notification.id,
        };

        if (notification.reason === "postComment") {
          const post = posts.find(
            (post) => post.cid === notification.reasonCid,
          );
          invariant(post, "Post should exist if it's in the notification");
          return {
            type: "postComment" as const,
            ...sharedAttributes,
            post,
          };
        }

        if (notification.reason === "commentReply") {
          const comment = comments.find(
            (comment) => comment.cid === notification.reasonCid,
          );
          invariant(
            comment,
            "Comment should exist if it's in the notification",
          );
          return {
            type: "postComment" as const,
            ...sharedAttributes,
            comment,
          };
        }

        const _exhaustiveCheck: never = notification.reason;
        throw new Error("Unknown notification reason");
      }),
    };
  },
);

export const getNotificationCount = cache(async () => {
  const user = await ensureUser();
  const [row] = await db
    .select({
      count: count(),
    })
    .from(schema.Notification)
    .where(
      and(
        eq(schema.Notification.did, user.did),
        isNull(schema.Notification.readAt),
      ),
    );

  invariant(row, "Row should exist");
  return row.count;
});

export async function markNotificationRead(notificationId: number) {
  await ensureUser();
  await db
    .update(schema.Notification)
    .set({
      readAt: new Date(),
    })
    .where(eq(schema.Notification.id, notificationId));
}

export async function markAllNotificationsRead() {
  const user = await ensureUser();
  await db
    .update(schema.Notification)
    .set({
      readAt: new Date(),
    })
    .where(
      and(
        isNull(schema.Notification.readAt),
        eq(schema.Notification.did, user.did),
      ),
    );
}

type CreateNotificationInput = {
  did: DID;
  reason: "postComment" | "commentReply";
  reasonUri: z.infer<typeof AtUri>;
  reasonCid: string;
};

export async function unauthed_createNotification(
  tx: SQLiteTransaction<
    "async",
    ResultSet,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >,
  { did, reason, reasonUri, reasonCid }: CreateNotificationInput,
) {
  await tx.insert(schema.Notification).values({
    did,
    reason,
    reasonCid,
    createdAt: new Date(),
    reasonUri,
  });
}
