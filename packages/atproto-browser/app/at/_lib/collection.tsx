"use client";

import { listRecords } from "@/lib/atproto";
import { getAtUriPath } from "@/lib/util";
import { AtUri } from "@atproto/syntax";
import Link from "next/link";
import { Suspense, useState } from "react";
import useSWR from "swr";

export function CollectionItems({
  repo,
  collection,
  pds,
  fetchKey,
  cursor,
}: {
  repo: string;
  collection: string;
  pds: string;
  fetchKey: `listCollections/collection:${string}/cursor:${string}`;
  cursor?: string;
}) {
  const { data } = useSWR(
    fetchKey,
    () => listRecords(pds, repo, collection, cursor),
    {
      suspense: true,
    },
  );
  const [more, setMore] = useState(false);

  return (
    <>
      {data.records.map((record) => {
        const uri = new AtUri(record.uri);
        return (
          <li key={record.uri}>
            <Link href={getAtUriPath(new AtUri(record.uri))}>{uri.rkey}</Link>
          </li>
        );
      })}
      {more ? (
        <Suspense fallback={<p>Loading...</p>}>
          <CollectionItems
            repo={repo}
            collection={collection}
            pds={pds}
            cursor={data.cursor!}
            fetchKey={`listCollections/collection:${collection}/cursor:${data.cursor!}`}
          />
        </Suspense>
      ) : data.cursor !== "self" && data.records.length > 0 ? (
        <button type="button" onClick={() => setMore(true)}>
          Load more
        </button>
      ) : null}
    </>
  );
}
