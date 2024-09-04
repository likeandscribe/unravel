import { DidDocument, DidResolver, HandleResolver } from "@atproto/identity";
import { cache } from "react";
import { unstable_cache as nextCache } from "next/cache";
import { isValidHandle } from "@atproto/syntax";
import { isDid } from "@atproto/did";

function timeoutWith<T>(
  timeout: number,
  promise: Promise<T>,
  errorMessage: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_res, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeout),
    ),
  ]);
}

const didResolver = new DidResolver({});
const makeResolveDidTag = (did: string) => [
  "atproto-identity-next",
  "resolveDid",
  did,
];
function resolveDid(did: string) {
  return nextCache(
    // TODO: Cache the timeout instead of throwing
    () => timeoutWith(1000, didResolver.resolve(did), "DID timeout"),
    makeResolveDidTag(did),
    {
      revalidate: 10,
      tags: makeResolveDidTag(did),
    },
  )();
}

const handleResolver = new HandleResolver({});
const makeResolveHandleTag = (handle: string) => [
  "atproto-identity-next",
  "resolveHandle",
  handle,
];
function resolveHandle(handle: string) {
  return nextCache(
    () => timeoutWith(3000, handleResolver.resolve(handle), "Handle timeout"),
    makeResolveHandleTag(handle),
    {
      revalidate: 10,
      tags: makeResolveHandleTag(handle),
    },
  )();
}

export const resolveIdentity = cache(
  async (
    didOrHandle: string,
  ): Promise<
    { success: true; identity: DidDocument } | { success: false; error: string }
  > => {
    const decoded = decodeURIComponent(didOrHandle);
    let didStr;
    if (isValidHandle(decoded)) {
      didStr = await resolveHandle(decoded).catch(() => undefined);
      if (!didStr) {
        return {
          success: false,
          error: `Could not resolve did from handle: ${decoded}`,
        };
      }
    } else {
      if (!isDid(decoded)) {
        return { success: false, error: `Invalid DID: ${decoded}` };
      }
      didStr = decoded;
    }

    const didDocument = await resolveDid(didStr);
    if (!didDocument) {
      return { success: false, error: `Could not resolve DID: ${didStr}` };
    }

    return { success: true, identity: didDocument };
  },
);
