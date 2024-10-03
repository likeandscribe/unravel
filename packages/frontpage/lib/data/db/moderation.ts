import "server-only";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { DID } from "../atproto/did";

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

export async function createModerationEvent(
  moderationEvent: ModerationEventDTO,
) {
  await db.insert(schema.ModerationEvent).values(moderationEvent);
  return;
}
