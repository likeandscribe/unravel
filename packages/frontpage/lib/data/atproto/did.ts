import { unstable_cache } from "next/cache";
import dns from "node:dns/promises";
import { cache } from "react";

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
