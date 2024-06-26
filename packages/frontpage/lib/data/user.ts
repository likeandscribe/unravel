import "server-only";
import { getSession } from "@/lib/auth";
import { decodeJwt } from "jose";
import { cache } from "react";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "../db";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import dns from "node:dns/promises";
import { unstable_cache } from "next/cache";

/**
 * Returns null when not logged in. If you want to ensure that the user is logged in, use `ensureUser` instead.
 */
export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) {
    return null;
  }

  if (!session.user) {
    throw new Error("Invalid session");
  }

  const token = decodeJwt(session.user.accessJwt);

  if (!token.sub) {
    throw new Error("Invalid token. Missing sub");
  }

  const pdsUrl = await getPdsUrl(token.sub);
  if (!pdsUrl) {
    throw new Error("No AtprotoPersonalDataServer service found");
  }

  return {
    handle: session.user.name,
    pdsUrl,
    did: token.sub,
    accessJwt: session.user.accessJwt,
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

export const getPdsUrl = cache(async (did: string) => {
  const plc = await getPlcDoc(did);

  return (
    plc.service.find((s) => s.type === "AtprotoPersonalDataServer")
      ?.serviceEndpoint ?? null
  );
});

export const getPlcDoc = cache(async (did: string) => {
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

const getAtprotoDidFromDns = unstable_cache(
  async (handle: string) => {
    const records = await dns.resolveTxt(`_atproto.${handle}`).catch((e) => {
      if ("code" in e && e.code === "ENODATA") {
        return [];
      }

      throw e;
    });
    // records is [ [ "did=xxx" ] ]
    // We're assuming that you only have one txt record or that the first one is the one we want
    return records[0]?.join().split("did=")[1] ?? null;
  },
  ["dns", "resolveTxt"],
  {
    revalidate: 60 * 60 * 24, // 24 hours
  },
);

export const getVerifiedHandle = cache(async (did: string) => {
  const plcDoc = await getPlcDoc(did);
  const plcHandle = plcDoc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  if (!plcHandle) return null;

  const dnsPromise = getAtprotoDidFromDns(plcHandle).catch((e) => {
    console.error(e);
    return null;
  });
  const httpPromise = fetch(`https://${plcHandle}/.well-known/atproto-did`, {
    next: {
      revalidate: 60 * 60 * 24, // 24 hours
    },
  })
    .then((res) => res.text())
    .catch((e) => {
      console.error(e);
      return null;
    });

  if ((await dnsPromise) === did || (await httpPromise)?.trim() === did) {
    return plcHandle;
  }
  return null;
});

const ProfileResponse = z.object({
  avatar: z.string(),
  handle: z.string(),
});

export const getBlueskyProfile = cache(async (did: string) => {
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
