import { getHandle, getKey, getPds } from "@atproto/identity";
import { AtUri } from "@atproto/syntax";
import { isDid } from "@atproto/did";
import { Fragment, Suspense } from "react";
import Link from "next/link";
import { AtBlob } from "./_lib/at-blob";
import { CollectionItems } from "./_lib/collection";
import { SWRConfig } from "swr";
import { listRecords } from "@/lib/atproto";
import { verifyRecords } from "@atproto/repo";
import { ErrorBoundary } from "react-error-boundary";
import { z } from "zod";
import { resolveIdentity } from "@/lib/atproto-server";

export default async function AtPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const uri = new AtUri(searchParams.u!);

  const identityResult = await resolveIdentity(uri.hostname);
  if (!identityResult.success) {
    return <div>{identityResult.error}</div>;
  }

  const didDocument = identityResult.identity;

  const pds = getPds(didDocument);
  if (!pds) {
    return <div>No PDS found for DID: {didDocument.id}</div>;
  }

  const handle = getHandle(didDocument) ?? `<invalid handle>`;

  if (uri.pathname === "/" || uri.pathname === "") {
    return (
      <>
        <h1>
          {handle} ({didDocument.id})
        </h1>
        <DidSummary did={didDocument.id} />

        <Suspense fallback={<p>Loading history...</p>}>
          <ErrorBoundary fallback={<p>Failed to fetch history.</p>}>
            <h2>History</h2>
            <DidHistory did={didDocument.id} />
          </ErrorBoundary>
        </Suspense>
      </>
    );
  }

  if (!uri.rkey) {
    const fetchKey =
      `listCollections/collection:${uri.collection}/cursor:none` as const;
    return (
      <div>
        <h1>
          {handle}&apos;s {uri.collection} records
        </h1>
        <ul>
          <SWRConfig
            value={{
              fallback: {
                [fetchKey]: listRecords(pds, didDocument.id, uri.collection),
              },
            }}
          >
            <CollectionItems
              collection={uri.collection}
              pds={pds}
              repo={didDocument.id}
              fetchKey={fetchKey}
            />
          </SWRConfig>
        </ul>
      </div>
    );
  }

  const getRecordUrl = new URL(`${pds}/xrpc/com.atproto.repo.getRecord`);
  getRecordUrl.searchParams.set("repo", didDocument.id);
  getRecordUrl.searchParams.set("collection", uri.collection);
  getRecordUrl.searchParams.set("rkey", uri.rkey);

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
    <div>
      <details>
        <summary>
          Author: {handle} (
          <Link href={`/at?u=at://${didDocument.id}`}>{didDocument.id}</Link>)
        </summary>
        <Suspense>
          <DidSummary did={didDocument.id} />
        </Suspense>
      </details>
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
            collection={uri.collection}
            rkey={uri.rkey}
          />
        </Suspense>
      </h2>
      <JSONValue data={record} repo={didDocument.id} />
    </div>
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

async function DidSummary({ did }: { did: string }) {
  return (
    <>
      <ErrorBoundary
        fallback={<div>Failed to fetch collections for {did}.</div>}
      >
        <h2>Collections</h2>
        <DidCollections did={did} />
      </ErrorBoundary>
      <h2>DID Doc</h2>
      <DidDoc did={did} />
    </>
  );
}

async function DidDoc({ did }: { did: string }) {
  const identityResult = await resolveIdentity(did);
  return <JSONValue data={identityResult as JSONType} repo={did} />;
}

async function DidCollections({ did }: { did: string }) {
  const identityResult = await resolveIdentity(did);
  if (!identityResult.success) {
    throw new Error(`Could not resolve DID: ${did}`);
  }
  const didDocument = identityResult.identity;
  const pds = getPds(didDocument);
  if (!pds) {
    throw new Error(`No PDS found for DID: ${didDocument.id}`);
  }

  const describeRepoUrl = new URL(`${pds}/xrpc/com.atproto.repo.describeRepo`);
  describeRepoUrl.searchParams.set("repo", didDocument.id);
  const response = await fetch(describeRepoUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch collections: ${response.statusText}. URL: ${describeRepoUrl.toString()}`,
    );
  }

  const { collections } = (await response.json()) as {
    collections: string[];
  };

  return (
    <ul>
      {collections.length === 0 ? (
        <p>No collections.</p>
      ) : (
        collections.map((nsid) => {
          const collectionUri = `at://${[did, nsid].join("/")}`;

          return (
            <li key={nsid}>
              <Link href={`/at?u=${collectionUri}`}>{nsid}</Link>
            </li>
          );
        })
      )}
    </ul>
  );
}

const PlcLogAuditResponse = z.array(
  z.object({
    createdAt: z
      .string()
      .datetime()
      .transform((x) => new Date(x)),
    operation: z.union([
      z.object({
        type: z.literal("plc_operation"),
        sig: z.string(),
        prev: z.string().nullable(),
        services: z.record(
          z.object({
            type: z.string(),
            endpoint: z.string(),
          }),
        ),
        alsoKnownAs: z.array(z.string()),
        rotationKeys: z.array(z.string()),
        verificationMethods: z.record(z.string()),
      }),
      z.object({
        type: z.literal("create"),
        signingKey: z.string(),
        recoveryKey: z.string(),
        handle: z.string(),
        service: z.string(),
      }),
      z.object({
        type: z.literal("plc_tombstone"),
      }),
    ]),
  }),
);

const utcDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function isNotNull<T>(x: T | null): x is T {
  return x !== null;
}

async function DidHistory({ did }: { did: string }) {
  const response = await fetch(`https://plc.directory/${did}/log/audit`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }

  const auditLog = PlcLogAuditResponse.parse(await response.json());

  return (
    <ol>
      {auditLog.map((previous, index) => {
        const previousOperation = previous.operation;
        if (previousOperation.type !== "plc_operation") {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={index}>
              Change created at {utcDateFormatter.format(previous.createdAt)}{" "}
              (UTC) of type &quot;{previousOperation.type}&quot;.
            </li>
          );
        }
        const entry = auditLog[index + 1];
        if (!entry) {
          return null;
        }
        const entryOperation = entry.operation;
        if (entryOperation.type !== "plc_operation") {
          return null;
        }

        const alsoKnownAsAdded = entryOperation.alsoKnownAs.filter(
          (x) => !previousOperation.alsoKnownAs.includes(x),
        );
        const alsoKnownAsRemoved = previousOperation.alsoKnownAs.filter(
          (x) => !entryOperation.alsoKnownAs.includes(x),
        );

        const servicesChanged = Object.entries(entryOperation.services)
          .map(([id, service]) => {
            const previousService = previousOperation.services[id];
            if (!previousService) return null;
            return {
              id,
              type:
                service.type !== previousService.type
                  ? {
                      from: previousService.type,
                      to: service.type,
                    }
                  : null,
              endpoint:
                service.endpoint !== previousService.endpoint
                  ? {
                      from: previousService.endpoint,
                      to: service.endpoint,
                    }
                  : null,
            };
          })
          .filter(isNotNull);

        const servicesAdded = Object.entries(entryOperation.services).filter(
          ([id]) => !previousOperation.services[id],
        );
        const servicesRemoved = Object.entries(
          previousOperation.services,
        ).filter(([id]) => !entryOperation.services[id]);

        const rotationKeysAdded = entryOperation.rotationKeys.filter(
          (x) => !previousOperation.rotationKeys.includes(x),
        );
        const rotationKeysRemoved = previousOperation.rotationKeys.filter(
          (x) => !entryOperation.rotationKeys.includes(x),
        );

        const verificationMethodsChanged = Object.entries(
          entryOperation.verificationMethods,
        )
          .map(([id, key]) => {
            const previousKey = previousOperation.verificationMethods[id];
            if (!previousKey) return null;
            if (key === previousKey) return null;
            return {
              id,
              from: previousKey,
              to: key,
            };
          })
          .filter(isNotNull);
        const verificationMethodsAdded = Object.entries(
          entryOperation.verificationMethods,
        ).filter(([id]) => !previousOperation.verificationMethods[id]);
        const verificationMethodsRemoved = Object.entries(
          previousOperation.verificationMethods,
        ).filter(([id]) => !entryOperation.verificationMethods[id]);

        return (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <p>
              Change created at {utcDateFormatter.format(entry.createdAt)} (UTC)
            </p>
            <ul>
              {alsoKnownAsAdded.length === 1 &&
              alsoKnownAsRemoved.length === 1 ? (
                <li>
                  Alias changed from{" "}
                  <Link href={`/at?u=${alsoKnownAsRemoved[0]}`}>
                    {alsoKnownAsRemoved[0]}
                  </Link>{" "}
                  to{" "}
                  <Link href={`/at?u=${alsoKnownAsAdded[0]}`}>
                    {alsoKnownAsAdded[0]}
                  </Link>
                </li>
              ) : (
                <>
                  {alsoKnownAsAdded.length > 0 && (
                    <li>
                      Alias added:{" "}
                      {alsoKnownAsAdded.flatMap((aka) => [
                        <Link key={aka} href={`/at?u=${aka}`}>
                          {aka}
                        </Link>,
                        ", ",
                      ])}
                    </li>
                  )}
                  {alsoKnownAsRemoved.length > 0 && (
                    <li>
                      Alias removed:{" "}
                      {alsoKnownAsRemoved.flatMap((aka) => [
                        <Link key={aka} href={`/at?u=at://${aka}`}>
                          {aka}
                        </Link>,
                        ", ",
                      ])}
                    </li>
                  )}
                </>
              )}
              {servicesChanged.length > 0 &&
                servicesChanged.map((service) => (
                  <Fragment key={service.id}>
                    {!!service.type && (
                      <li key={service.id}>
                        Service &quot;{service.id}&quot; changed type from
                        &quot;
                        {service.type.from}&quot; to &quot;{service.type.to}
                        &quot;
                      </li>
                    )}
                    {!!service.endpoint && (
                      <li key={service.id}>
                        Service &quot;{service.id}&quot; changed endpoint from{" "}
                        <a href={service.endpoint.from}>
                          {service.endpoint.from}
                        </a>{" "}
                        to{" "}
                        <a href={service.endpoint.to}>{service.endpoint.to}</a>
                      </li>
                    )}
                  </Fragment>
                ))}
              {servicesAdded.length > 0 && (
                <li>
                  Services added:{" "}
                  {servicesAdded.flatMap(([id, service]) => [
                    <Link key={id} href={service.endpoint}>
                      {id} ({service.type})
                    </Link>,
                    ", ",
                  ])}
                </li>
              )}
              {servicesRemoved.length > 0 && (
                <li>
                  Services removed:{" "}
                  {servicesRemoved.flatMap(([id, service]) => [
                    <Link key={id} href={service.endpoint}>
                      {id} ({service.type})
                    </Link>,
                    ", ",
                  ])}
                </li>
              )}
              {rotationKeysAdded.length > 0 && (
                <li>
                  Rotation keys added:{" "}
                  {rotationKeysAdded.flatMap((key) => [
                    <code key={key}>{key}</code>,
                    ", ",
                  ])}
                </li>
              )}
              {rotationKeysRemoved.length > 0 && (
                <li>
                  Rotation keys removed:{" "}
                  {rotationKeysRemoved.flatMap((key) => [
                    <code key={key}>{key}</code>,
                    ", ",
                  ])}
                </li>
              )}
              {verificationMethodsChanged.length > 0 &&
                verificationMethodsChanged.map((method) => (
                  <li key={method.id}>
                    Verification method &quot;{method.id}&quot; changed from{" "}
                    <code>{method.from}</code> to <code>{method.to}</code>
                  </li>
                ))}
              {verificationMethodsAdded.length > 0 && (
                <li>
                  Verification methods added:{" "}
                  {verificationMethodsAdded.flatMap(([id, key]) => [
                    <Fragment key={id}>
                      <code>{key}</code> (&quot;{id}&quot;)
                    </Fragment>,
                    ", ",
                  ])}
                </li>
              )}
              {verificationMethodsRemoved.length > 0 && (
                <li>
                  Verification methods removed:{" "}
                  {verificationMethodsRemoved.flatMap(([id, key]) => [
                    <Fragment key={id}>
                      <code>{key}</code> (&quot;{id}&quot;)
                    </Fragment>,
                    ", ",
                  ])}
                </li>
              )}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function naiveAtUriCheck(atUri: string) {
  if (!atUri.startsWith("at://")) {
    return false;
  }

  // Check there is no whitespace in the URI
  return atUri.split(" ").length === 1;
}

function JSONString({ data }: { data: string }) {
  return (
    <pre
      style={{
        color: "darkgreen",
      }}
    >
      {naiveAtUriCheck(data) ? (
        <>
          &quot;<Link href={`/at?u=${data}`}>{data}</Link>
          &quot;
        </>
      ) : isDid(data) ? (
        <>
          &quot;<Link href={`/at?u=at://${data}`}>{data}</Link>
          &quot;
        </>
      ) : URL.canParse(data) ? (
        <>
          &quot;
          <a href={data} rel="noopener noreferer">
            {data}
          </a>
          &quot;
        </>
      ) : (
        `"${data}"`
      )}
    </pre>
  );
}

function JSONNumber({ data }: { data: number }) {
  return (
    <pre
      style={{
        color: "darkblue",
      }}
    >
      {data}
    </pre>
  );
}

function JSONBoolean({ data }: { data: boolean }) {
  return (
    <pre
      style={{
        color: "darkblue",
      }}
    >
      {data ? "true" : "false"}
    </pre>
  );
}

function JSONNull() {
  return (
    <pre
      style={{
        color: "darkgray",
      }}
    >
      null
    </pre>
  );
}

function JSONObject({
  data,
  repo,
}: {
  data: { [x: string]: JSONType };
  repo: string;
}) {
  const rawObj = (
    <dl>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} style={{ display: "flex", gap: 10 }}>
          <dt>
            <pre>{key}:</pre>
          </dt>
          <dd style={{ margin: 0 }}>
            <JSONValue data={value} repo={repo} />
          </dd>
        </div>
      ))}
    </dl>
  );

  const parseBlobResult = AtBlob.safeParse(data);
  if (
    parseBlobResult.success &&
    parseBlobResult.data.mimeType.startsWith("image/")
  ) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${repo}/${parseBlobResult.data.ref.$link}@jpeg`}
          alt=""
          width={200}
        />
        <details>
          <summary>View blob content</summary>
          {rawObj}
        </details>
      </>
    );
  }

  return rawObj;
}

function JSONArray({ data, repo }: { data: JSONType[]; repo: string }) {
  return (
    <ul>
      {data.map((value, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index}>
          <JSONValue data={value} repo={repo} />
        </li>
      ))}
    </ul>
  );
}

function JSONValue({ data, repo }: { data: JSONType; repo: string }) {
  if (typeof data === "string") {
    return <JSONString data={data} />;
  }
  if (typeof data === "number") {
    return <JSONNumber data={data} />;
  }
  if (typeof data === "boolean") {
    return <JSONBoolean data={data} />;
  }
  if (data === null) {
    return <JSONNull />;
  }
  if (Array.isArray(data)) {
    return <JSONArray data={data} repo={repo} />;
  }
  return <JSONObject data={data} repo={repo} />;
}

type JSONType =
  | string
  | number
  | boolean
  | null
  | {
      [x: string]: JSONType;
    }
  | JSONType[];
