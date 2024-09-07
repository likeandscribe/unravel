import { unstable_cache } from "next/cache";
import dns from "node:dns/promises";
import { cache } from "react";
import { z } from "zod";

type Brand<K, T> = K & { __brand: T };
export type DID = Brand<string, "DID">;

export function isDid(s: string): s is DID {
  return s.startsWith("did:");
}

export function parseDid(s: string): DID | null {
  if (!isDid(s)) {
    return null;
  }
  return s;
}

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
    const val = records[0]?.join().split("did=")[1];
    return val ? parseDid(val) : null;
  },
  ["did", "dns"],
  {
    revalidate: 60 * 60 * 24, // 24 hours
  },
);

const getAtprotoFromHttps = unstable_cache(
  async (handle: string) => {
    let res;
    const timeoutSignal = AbortSignal.timeout(1500);
    try {
      res = await fetch(`https://${handle}/.well-known/atproto-did`, {
        signal: timeoutSignal,
      });
    } catch (_e) {
      // We're caching failures here, we should at some point invalidate the cache by listening to handle changes on the network
      return null;
    }

    if (!res.ok) {
      return null;
    }
    return parseDid(await res.text());
  },
  ["did", "https"],
  {
    revalidate: 60 * 60 * 24, // 24 hours
  },
);

export const getVerifiedDid = cache(async (handle: string) => {
  const [dnsDid, httpDid] = await Promise.all([
    getAtprotoDidFromDns(handle).catch((_) => {
      return null;
    }),
    getAtprotoFromHttps(handle).catch((_) => {
      return null;
    }),
  ]);

  if (dnsDid && httpDid && dnsDid !== httpDid) {
    return null;
  }

  // TODO: Check did doc includes the handle

  return dnsDid ?? (httpDid ? parseDid(httpDid) : null);
});

/**
 * Returns the DID of the the handle or the DID itself if it's a DID. Or null if the handle doesn't resolve to a DID.
 */
export const getDidFromHandleOrDid = cache(async (handleOrDid: string) => {
  const decodedHandleOrDid = decodeURIComponent(handleOrDid);
  if (isDid(decodedHandleOrDid)) {
    return decodedHandleOrDid;
  }

  return getVerifiedDid(decodedHandleOrDid);
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

export const getDidDoc = cache(async (did: DID) => {
  const response = await fetch(`https://plc.directory/${did}`, {
    next: {
      // TODO: Also revalidate this when we receive an identity change event
      // That would allow us to extend the revalidation time to 1 day
      revalidate: 60 * 60, // 1 hour
    },
  });

  return PlcDocument.parse(await response.json());
});

export const getPdsUrl = cache(async (did: DID) => {
  const plc = await getDidDoc(did);

  return (
    plc.service.find((s) => s.type === "AtprotoPersonalDataServer")
      ?.serviceEndpoint ?? null
  );
});

export const getVerifiedHandle = cache(async (did: DID) => {
  const plcDoc = await getDidDoc(did);
  const plcHandle = plcDoc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  if (!plcHandle) return null;

  const resolvedDid = await getVerifiedDid(plcHandle);

  return resolvedDid ? plcHandle : null;
});
