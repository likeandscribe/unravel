import { DidResolver, getPds, HandleResolver } from "@atproto/identity";
import { AtUri, isValidHandle } from "@atproto/syntax";
import { isDid } from "@atproto/did";
import { Fragment } from "react";
import Link from "next/link";
import { AtUriForm } from "@/app/aturi-form";

type Params = {
  at: string;
};

export default async function AtPage({ params }: { params: Params }) {
  const uri = new AtUri(decodeURIComponent(params.at));

  let didStr;
  if (isValidHandle(uri.hostname)) {
    const handleResolver = new HandleResolver({});
    didStr = await handleResolver.resolve(uri.hostname);
    if (!didStr) {
      return <div>Could not resolve handle from did: {uri.hostname}</div>;
    }
  } else {
    if (!isDid(uri.hostname)) {
      return <div>Invalid DID: {uri.hostname}</div>;
    }
    didStr = uri.hostname;
  }

  const didResolver = new DidResolver({});
  const didDocument = await didResolver.resolve(didStr);
  if (!didDocument) {
    return <div>Could not resolve DID: {didStr}</div>;
  }
  const pds = getPds(didDocument);
  if (!pds) {
    return <div>No PDS found for DID: {didDocument.id}</div>;
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

  const data = (await response.json()) as JSONType;

  return (
    <div>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/">🏠</Link>
        <AtUriForm defaultUri={uri.toString()} style={{ flexGrow: 1 }} />
      </div>
      <JSONValue data={data} />
    </div>
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
          &quot;<Link href={`/at/${encodeURIComponent(data)}`}>{data}</Link>
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
  return (
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
