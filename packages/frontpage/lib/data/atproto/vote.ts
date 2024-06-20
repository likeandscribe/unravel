import "server-only";
import { ensureIsInBeta, ensureUser } from "../user";
import { atprotoCreateRecord, atprotoDeleteRecord } from "./record";

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

  await atprotoCreateRecord({
    collection: "fyi.unravel.frontpage.vote",
    record: {
      createdAt: new Date().toISOString(),
      subject: {
        cid: subjectCid,
        uri,
      },
    },
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
