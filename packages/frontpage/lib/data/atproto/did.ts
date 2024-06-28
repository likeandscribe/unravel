import { unstable_cache } from "next/cache";
import dns from "node:dns/promises";

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

export const getAtprotoDidFromDns = unstable_cache(
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
