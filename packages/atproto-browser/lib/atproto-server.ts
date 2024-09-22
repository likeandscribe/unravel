import "server-only";
import {
  DidDocument,
  DidResolver,
  getHandle,
  HandleResolver,
} from "@atproto/identity";
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
const resolveDid = cache(
  nextCache(
    cache((did: string) =>
      timeoutWith(1000, didResolver.resolve(did), "DID timeout"),
    ),
    ["did-doc"],
    {
      revalidate: 10,
    },
  ),
);
const handleResolver = new HandleResolver({});
const resolveHandle = cache(
  nextCache(
    cache((handle: string) =>
      timeoutWith(3000, handleResolver.resolve(handle), "Handle timeout"),
    ),
    ["handle-from-did"],
    {
      revalidate: 10,
    },
  ),
);

export async function resolveIdentity(
  didOrHandle: string,
): Promise<
  | { success: true; didDocument: DidDocument; handle: string | null }
  | { success: false; error: string }
> {
  const decoded = decodeURIComponent(didOrHandle);
  let didStr;
  let didFromHandle = null;
  if (isValidHandle(decoded)) {
    didFromHandle = await resolveHandle(decoded).catch(() => undefined);
    didStr = didFromHandle;
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

  const handle = getHandle(didDocument);
  if (!handle) {
    return {
      success: false,
      error: `Could not find handle in DID document: ${didStr}`,
    };
  }

  if (didFromHandle === null) {
    didFromHandle = await resolveHandle(handle).catch(() => undefined);
  }

  return {
    success: true,
    didDocument: didDocument,
    handle: didFromHandle === didDocument.id ? handle : null,
  };
}
