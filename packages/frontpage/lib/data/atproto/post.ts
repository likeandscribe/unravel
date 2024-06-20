import "server-only";
import { ensureIsInBeta } from "../user";
import { atprotoCreateRecord, atprotoDeleteRecord } from "./record";
import { z } from "zod";

export const PostRecord = z.object({
  title: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

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
    collection: "fyi.unravel.frontpage.post",
  });

  return {
    rkey: result.uri.rkey,
  };
}

export async function deletePost(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: "fyi.unravel.frontpage.post",
  });
}
