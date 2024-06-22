import "server-only";
import { ensureIsInBeta, ensureUser } from "../user";
import {
  atprotoCreateRecord,
  atprotoDeleteRecord,
  createAtUriParser,
} from "./record";
import { z } from "zod";
import { PostCollection } from "./post";
import { CommentCollection } from "./comment";

const VoteSubjectCollection = z.union([
  z.literal(PostCollection),
  z.literal(CommentCollection),
]);

export const VoteRecord = z.object({
  createdAt: z.string(),
  subject: z.object({
    cid: z.string(),
    uri: createAtUriParser(VoteSubjectCollection),
  }),
});

type VoteInput = {
  subjectRkey: string;
  subjectCid: string;
  subjectCollection: string;
  subjectAuthorDid: string;
};

export async function createVote({
  subjectRkey,
  subjectCid,
  subjectCollection,
  subjectAuthorDid,
}: VoteInput) {
  await ensureUser();
  await ensureIsInBeta();
  const uri = `at://${subjectAuthorDid}/${subjectCollection}/${subjectRkey}`;

  const record = {
    createdAt: new Date().toISOString(),
    subject: {
      cid: subjectCid,
      uri,
    },
  };

  VoteRecord.parse(record);

  await atprotoCreateRecord({
    collection: "fyi.unravel.frontpage.vote",
    record: record,
  });
}

export async function deleteVote(rkey: string) {
  await ensureUser();
  await ensureIsInBeta();

  await atprotoDeleteRecord({
    collection: "fyi.unravel.frontpage.vote",
    rkey,
  });
}
