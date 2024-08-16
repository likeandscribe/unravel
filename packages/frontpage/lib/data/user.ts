import "server-only";
import { getSession } from "@/lib/auth";
import { cache } from "react";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "../db";
import { and, count, eq } from "drizzle-orm";
import * as schema from "../schema";
import { DID, getVerifiedDid } from "./atproto/did";

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

export const getPdsUrl = cache(async (did: DID) => {
  const plc = await getPlcDoc(did);

  return (
    plc.service.find((s) => s.type === "AtprotoPersonalDataServer")
      ?.serviceEndpoint ?? null
  );
});

export const getPlcDoc = cache(async (did: DID) => {
  const response = await fetch(`https://plc.directory/${did}`, {
    next: {
      // TODO: Also revalidate this when we receive an identity change event
      // That would allow us to extend the revalidation time to 1 day
      revalidate: 60 * 60, // 1 hour
    },
  });

  return PlcDocument.parse(await response.json());
});

const PlcDocument = z.object({
  id: z.string(),
  alsoKnownAs: z.array(z.string()),
  service: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      serviceEndpoint: z.string(),
    }),
  ),
});

export const getVerifiedHandle = cache(async (did: DID) => {
  const plcDoc = await getPlcDoc(did);
  const plcHandle = plcDoc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  if (!plcHandle) return null;

  const resolvedDid = await getVerifiedDid(plcHandle);

  return resolvedDid ? plcHandle : null;
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
