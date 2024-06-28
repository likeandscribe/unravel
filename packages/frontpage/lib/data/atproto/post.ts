import "server-only";
import { ensureIsInBeta, getPdsUrl } from "../user";
import {
  atprotoCreateRecord,
  atprotoDeleteRecord,
  atprotoGetRecord,
} from "./record";
import { z } from "zod";
import { DataLayerError } from "../error";
import { DID } from "./did";

export const PostCollection = "fyi.unravel.frontpage.post";

export const PostRecord = z.object({
  title: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

export type Post = z.infer<typeof PostRecord>;

type PostInput = {
  title: string;
  url: string;
};

export async function createPost({ title, url }: PostInput) {
  await ensureIsInBeta();
  const record = { title, url, createdAt: new Date().toISOString() };
  PostRecord.parse(record);

  const result = await atprotoCreateRecord({
    record,
    collection: PostCollection,
  });

  return {
    rkey: result.uri.rkey,
  };
}

export async function deletePost(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: PostCollection,
  });
}

export async function getPost({ rkey, repo }: { rkey: string; repo: DID }) {
  const service = await getPdsUrl(repo);

  if (!service) {
    throw new DataLayerError("Failed to get service url");
  }

  const { value } = await atprotoGetRecord({
    serviceEndpoint: service,
    repo,
    collection: PostCollection,
    rkey,
  });

  return PostRecord.parse(value);
}
