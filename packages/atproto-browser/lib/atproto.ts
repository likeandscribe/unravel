import { cache } from "react";
import { z } from "zod";

const ListRecordsResponse = z.object({
  records: z.array(
    z.object({
      uri: z.string(),
      cid: z.string(),
    }),
  ),
  cursor: z.string().optional(),
});

export const listRecords = cache(
  async (pds: string, repo: string, collection: string, cursor?: string) => {
    const listRecordsUrl = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
    listRecordsUrl.searchParams.set("repo", repo);
    listRecordsUrl.searchParams.set("collection", collection);
    if (cursor) {
      listRecordsUrl.searchParams.set("cursor", cursor);
    }
    const res = await fetch(listRecordsUrl.toString());
    if (!res.ok) {
      throw new Error(`Failed to list records: ${res.statusText}`);
    }
    return ListRecordsResponse.parse(await res.json());
  },
);

export const describeRepo = cache(async (pds: string, repo: string) => {
  const describeRepoUrl = new URL(`${pds}/xrpc/com.atproto.repo.describeRepo`);
  describeRepoUrl.searchParams.set("repo", repo);
  const res = await fetch(describeRepoUrl.toString());
  if (!res.ok && res.status !== 400) {
    throw new Error(`Failed to describe repo: ${res.statusText}`);
  }
  const body = await res.json();

  if (res.status === 400 && "error" in body && body.error === "RepoNotFound") {
    return null;
  }

  return body as {
    collections: string[];
  };
});
