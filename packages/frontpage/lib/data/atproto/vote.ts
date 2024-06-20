import "server-only";
import { ensureIsInBeta, ensureUser } from "../user";
import {
  atprotoCreateRecord,
  atprotoDeleteRecord,
  createAtUriParser,
} from "./record";
import { z } from "zod";

const VoteSubjectCollection = z.union([
  z.literal("fyi.unravel.frontpage.post"),
  z.literal("fyi.unravel.frontpage.comment"),
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
};

export async function createVote({
  subjectRkey,
  subjectCid,
  subjectCollection,
}: VoteInput) {
  const user = await ensureUser();
  await ensureIsInBeta();
  const uri = `at://${user.did}/${subjectCollection}/${subjectRkey}`;

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
