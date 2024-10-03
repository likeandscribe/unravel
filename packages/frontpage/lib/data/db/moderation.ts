import "server-only";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { DID } from "../atproto/did";
import { isAdmin } from "../user";

export type ModerationEventDTO = {
  subjectUri: string;
  subjectDid: DID;
  subjectCollection?: string | null;
  subjectRkey?: string | null;
  subjectCid?: string | null;
  createdBy: DID;
  createdAt: Date;
  labelsAdded?: string | null;
  labelsRemoved?: string | null;
  creatorReportReason?: string | null;
};

export async function createModerationEvent({
  subjectUri,
  subjectDid,
  subjectCollection,
  subjectRkey,
  subjectCid,
  createdBy,
  createdAt,
  labelsAdded,
  labelsRemoved,
  creatorReportReason,
}: ModerationEventDTO) {
  const adminUser = await isAdmin();

  if (!adminUser) {
    throw new Error("User is not an admin");
  }

  await db.insert(schema.ModerationEvent).values({
    subjectUri,
    subjectDid,
    subjectCollection,
    subjectRkey,
    subjectCid,
    createdBy,
    createdAt,
    labelsAdded,
    labelsRemoved,
    creatorReportReason,
  });
  return;
}
