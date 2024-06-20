import "server-only";
import { ensureIsInBeta, ensureUser } from "../user";
import { atprotoCreateRecord, parseAtUri, atprotoDeleteRecord } from "./record";
import { DataLayerError } from "../error";

type CommentInput = {
  subjectRkey: string;
  subjectCid: string;
  subjectCollection: string;
  content: string;
};

export async function createComment({
  subjectRkey,
  subjectCid,
  subjectCollection,
  content,
}: CommentInput) {
  await ensureIsInBeta();
  const user = await ensureUser();

  const result = await atprotoCreateRecord({
    record: {
      content,
      subject: {
        cid: subjectCid,
        uri: `at://${user.did}/${subjectCollection}/${subjectRkey}`,
      },
      createdAt: new Date().toISOString(),
    },
    collection: "fyi.unravel.frontpage.comment",
  });

  const uri = parseAtUri(result.uri);
  if (!uri || !uri.rkey) {
    throw new DataLayerError(`Failed to parse AtUri: "${result.uri}"`);
  }
  return {
    rkey: uri.rkey,
  };
}

export async function deleteComment(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: "fyi.unravel.frontpage.comment",
  });
}
