import "server-only";
import { ensureIsInBeta } from "../user";
import { atprotoCreateRecord, atprotoDeleteRecord, parseAtUri } from "./record";
import { DataLayerError } from "../error";

type PostInput = {
  title: string;
  url: string;
};

export async function createPost({ title, url }: PostInput) {
  await ensureIsInBeta();

  const result = await atprotoCreateRecord({
    record: { title, url, createdAt: new Date().toISOString() },
    collection: "fyi.unravel.frontpage.post",
  });

  const uri = parseAtUri(result.uri);
  if (!uri || !uri.rkey) {
    throw new DataLayerError(`Failed to parse AtUri: "${result.uri}"`);
  }
  return {
    rkey: uri.rkey,
  };
}

export async function deletePost(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: "fyi.unravel.frontpage.post",
  });
}
