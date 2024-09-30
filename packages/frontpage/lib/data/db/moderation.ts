import "server-only";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export type ModerationEventDTO = {
  subjectUri: string;
  subjectDid: string;
  subjectCollection?: string | null;
  subjectRkey?: string | null;
  subjectCid?: string | null;
  createdBy: string;
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
