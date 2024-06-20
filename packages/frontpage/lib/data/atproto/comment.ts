import "server-only";
import { ensureIsInBeta, ensureUser } from "../user";
import { atprotoCreateRecord } from "./record";

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

  await atprotoCreateRecord({
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
}
