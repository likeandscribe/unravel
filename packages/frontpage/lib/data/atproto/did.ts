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
    return (records[0]?.join().split("did=")[1] ?? null) as DID | null;
  },
  ["dns", "resolveTxt"],
  {
    revalidate: 60 * 60 * 24, // 24 hours
  },
);

export const getVerifiedDid = cache(async (handle: string) => {
  const [dnsDid, httpDid] = await Promise.all([
    getAtprotoDidFromDns(handle).catch((_) => {
      return null;
    }),
    fetch(`https://${handle}/.well-known/atproto-did`, {
      next: {
        revalidate: 60 * 60 * 24, // 24 hours
      },
    })
      .then((res) => {
        if (!res.ok) {
          return null;
        }
        return res.text();
      })
      .catch((_) => {
        return null;
      }),
  ]);

  if (dnsDid && httpDid && dnsDid !== httpDid) {
    return null;
  }

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
