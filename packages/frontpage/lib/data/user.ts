import "server-only";
import { getSession } from "@/lib/auth";
import { cache } from "react";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "../db";
import { and, count, eq } from "drizzle-orm";
import * as schema from "../schema";
import { DID, getPdsUrl } from "./atproto/did";

/**
 * Returns null when not logged in. If you want to ensure that the user is logged in, use `ensureUser` instead.
 */
export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const pdsUrl = await getPdsUrl(session.user.did);
  if (!pdsUrl) {
    throw new Error("No AtprotoPersonalDataServer service found");
  }

  return {
    pdsUrl,
    did: session.user.did,
  };
});

export async function ensureUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

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

export const isAdmin = cache(async () => {
  const user = await ensureUser();
  if (!user) {
    return false;
  }

  const isAdmin = await db.query.AdminUser.findFirst({
    where: and(eq(schema.AdminUser.did, user.did)),
  });

  return Boolean(isAdmin);
});

const ProfileResponse = z.object({
  avatar: z.string(),
  handle: z.string(),
});

export const getBlueskyProfile = cache(async (did: DID) => {
  const json = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`,
    {
      next: {
        revalidate: 60 * 60, // 1 hour
      },
    },
  ).then((res) => res.json());

  return ProfileResponse.parse(json);
});

export const getTotalSubmissions = cache(async (did: DID) => {
  const [[postRow], [commentRow]] = await Promise.all([
    db
      .select({
        postCount: count(schema.Post.id),
      })
      .from(schema.Post)
      .where(
        and(eq(schema.Post.authorDid, did), eq(schema.Post.status, "live")),
      ),
    db
      .select({
        commentCount: count(schema.Comment.id),
      })
      .from(schema.Comment)
      .where(
        and(
          eq(schema.Comment.authorDid, did),
          eq(schema.Comment.status, "live"),
        ),
      ),
  ]);

  return {
    postCount: postRow?.postCount ?? 0,
    commentCount: commentRow?.commentCount ?? 0,
  };
});
