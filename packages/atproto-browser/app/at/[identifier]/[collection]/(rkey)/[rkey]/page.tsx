import { JSONType, JSONValue } from "@/app/at/_lib/atproto-json";
import { resolveIdentity } from "@repo/atproto-identity-next";
import { getHandle, getKey, getPds } from "@atproto/identity";
import { verifyRecords } from "@atproto/repo";
import { Suspense } from "react";

export default async function RkeyPage({
  params,
}: {
  params: {
    identifier: string;
    collection: string;
    rkey: string;
  };
}) {
  const identityResult = await resolveIdentity(params.identifier);
  if (!identityResult.success) {
    return <div>{identityResult.error}</div>;
  }
  const didDocument = identityResult.identity;
  const handle = getHandle(didDocument);
  if (!handle) {
    return <div>No handle found for DID: {didDocument.id}</div>;
  }
  const pds = getPds(didDocument);
  if (!pds) {
    return <div>No PDS found for DID: {didDocument.id}</div>;
  }

  const getRecordUrl = new URL(`${pds}/xrpc/com.atproto.repo.getRecord`);
  getRecordUrl.searchParams.set("repo", didDocument.id);
  getRecordUrl.searchParams.set("collection", params.collection);
  getRecordUrl.searchParams.set("rkey", params.rkey);

  const response = await fetch(getRecordUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return (
      <div>
        Failed to fetch record: {response.statusText}. URL:{" "}
        {getRecordUrl.toString()}
      </div>
    );
  }

  const record = (await response.json()) as JSONType;

  return (
    <>
      <h2>
        Record
        <Suspense
          fallback={
            <span title="Verifying record..." aria-busy>
              🤔
            </span>
          }
        >
          <RecordVerificationBadge
            did={didDocument.id}
            collection={params.collection}
            rkey={params.rkey}
          />
        </Suspense>
      </h2>
      <JSONValue data={record} repo={didDocument.id} />
    </>
  );
}

async function RecordVerificationBadge({
  did,
  collection,
  rkey,
}: {
  did: string;
  collection: string;
  rkey: string;
}) {
  const identityResult = await resolveIdentity(did);
  if (!identityResult.success) {
    throw new Error(identityResult.error);
  }
  const didDoc = identityResult.identity;
  const pds = getPds(didDoc);
  if (!pds) {
    return <span title="Invalid record (no pds)">❌</span>;
  }

  const verifyRecordsUrl = new URL(`${pds}/xrpc/com.atproto.sync.getRecord`);
  verifyRecordsUrl.searchParams.set("did", did);
  verifyRecordsUrl.searchParams.set("collection", collection);
  verifyRecordsUrl.searchParams.set("rkey", rkey);

  const response = await fetch(verifyRecordsUrl, {
    headers: {
      accept: "application/vnd.ipld.car",
    },
  });

  if (!response.ok) {
    return (
      <span title={`Invalid record (failed to fetch ${await response.text()})`}>
        ❌
      </span>
    );
  }
  const car = new Uint8Array(await response.arrayBuffer());
  const key = getKey(didDoc);
  if (!key) {
    return <span title="Invalid record (no key)">❌</span>;
  }

  try {
    await verifyRecords(car, did, key);
    return <span title="Valid record">🔒</span>;
  } catch (e) {
    if (e instanceof Error) {
      return <span title={`Invalid record (${e.message})`}>❌</span>;
    } else {
      return <span title="Invalid record (unknown)">❌</span>;
    }
  }
}
