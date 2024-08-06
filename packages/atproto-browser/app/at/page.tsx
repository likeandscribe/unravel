import {
  DidResolver,
  getHandle,
  getPds,
  HandleResolver,
} from "@atproto/identity";
import { AtUri, isValidHandle } from "@atproto/syntax";
import { isDid } from "@atproto/did";
import { cache, Fragment, Suspense } from "react";
import Link from "next/link";
import { AtBlob } from "./_lib/at-blob";
import { BlobImage } from "./_lib/blob-image";

const didResolver = new DidResolver({});
const resolveDid = cache((did: string) => didResolver.resolve(did));
const handleResolver = new HandleResolver({});
const resolveHandle = cache((handle: string) => handleResolver.resolve(handle));

export default async function AtPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const uri = new AtUri(searchParams.u!);

  let didStr;
  if (isValidHandle(uri.hostname)) {
    didStr = await resolveHandle(uri.hostname);
    if (!didStr) {
      return <div>Could not resolve handle from did: {uri.hostname}</div>;
    }
  } else {
    if (!isDid(uri.hostname)) {
      return <div>Invalid DID: {uri.hostname}</div>;
    }
    didStr = uri.hostname;
  }

  const didDocument = await resolveDid(didStr);
  if (!didDocument) {
    return <div>Could not resolve DID: {didStr}</div>;
  }
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
        <Author did={didStr} />
      </>
    );
  }

  if (!uri.rkey) {
    const listRecordsUrl = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
    listRecordsUrl.searchParams.set("repo", didDocument.id);
    listRecordsUrl.searchParams.set("collection", uri.collection);

    // TODO: pagination
    const response = await fetch(listRecordsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return (
        <div>
          Failed to fetch records: {response.statusText}. URL:{" "}
          {listRecordsUrl.toString()}
        </div>
      );
    }

    const { records, cursor } = (await response.json()) as {
      records: { uri: string }[];
      cursor: string | null;
    };

    return (
      <div>
        <h1>
          {handle}&apos;s {uri.collection} records
        </h1>
        <ul>
          {records.map((record) => {
            const uri = new AtUri(record.uri);
            return (
              <li key={record.uri}>
                <Link href={`/at?u=${record.uri}`}>{uri.rkey}</Link>
              </li>
            );
          })}
        </ul>
        {!!cursor && <p>And more records (pagination coming soon...)</p>}
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
          Author: {handle} (<Link href={`/at?u=at://${didStr}/`}>{didStr}</Link>
          )
        </summary>
        <Suspense>
          <Author did={didStr} />
        </Suspense>
      </details>
      <h2>Record</h2>
      <JSONValue data={record} />
    </div>
  );
}

async function Author({ did }: { did: string }) {
  const didDocument = await resolveDid(did);
  if (!didDocument) {
    throw new Error(`Could not resolve DID: ${did}`);
  }
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
    return (
      <div>
        Failed to fetch collections: {response.statusText}. URL:{" "}
        {describeRepoUrl.toString()}
      </div>
    );
  }

  const { collections } = (await response.json()) as {
    collections: string[];
  };

  return (
    <dl>
      <dt>PDS</dt>
      <dd>{pds}</dd>

      <dt>Collections</dt>
      <dd>
        {collections.length === 0
          ? "No collections."
          : collections.map((nsid) => {
              const collectionUri = `at://${[did, nsid].join("/")}`;

              return (
                <li key={nsid}>
                  <Link href={`/at?u=${collectionUri}`}>{nsid}</Link>
                </li>
              );
            })}
      </dd>
    </dl>
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

function JSONObject({ data }: { data: { [x: string]: JSONType } }) {
  const rawObj = (
    <dl>
      {Object.entries(data).map(([key, value]) => (
        <Fragment key={key}>
          <dt>
            <pre>{key}:</pre>
          </dt>
          <dd>
            <JSONValue data={value} />
          </dd>
        </Fragment>
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
        <BlobImage blob={parseBlobResult.data} />
        <details>
          <summary>View blob content</summary>
          {rawObj}
        </details>
      </>
    );
  }

  return rawObj;
}

function JSONArray({ data }: { data: JSONType[] }) {
  return (
    <div>
      {data.map((value, index) => (
        <div key={index}>
          <JSONValue data={value} />
        </div>
      ))}
    </div>
  );
}

function JSONValue({ data }: { data: JSONType }) {
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
    return <JSONArray data={data} />;
  }
  return <JSONObject data={data} />;
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
