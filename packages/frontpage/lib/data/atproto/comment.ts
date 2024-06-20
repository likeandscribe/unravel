import "server-only";
import { ensureIsInBeta, ensureUser } from "../user";
import {
  atprotoCreateRecord,
  createAtUriParser,
  atprotoDeleteRecord,
} from "./record";
import { DataLayerError } from "../error";
import { z } from "zod";

const CommentSubjectCollection = z.union([
  z.literal("fyi.unravel.frontpage.post"),
  z.literal("fyi.unravel.frontpage.comment"),
]);

export const CommentRecord = z.object({
  content: z.string(),
  subject: z.object({
    cid: z.string(),
    uri: createAtUriParser(CommentSubjectCollection),
  }),
  createdAt: z.string(),
});

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
  const record = {
    content,
    subject: {
      cid: subjectCid,
      uri: `at://${user.did}/${subjectCollection}/${subjectRkey}`,
    },
    createdAt: new Date().toISOString(),
  };

  CommentRecord.parse(record);

  const result = await atprotoCreateRecord({
    record,
    collection: "fyi.unravel.frontpage.comment",
  });

  return {
    rkey: result.uri.rkey,
  };
}

export async function deleteComment(rkey: string) {
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    rkey,
    collection: "fyi.unravel.frontpage.comment",
  });
}
