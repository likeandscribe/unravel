import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { cache } from "react";
import { InferSelectModel, eq } from "drizzle-orm";
import { sendDiscordMessage } from "@/lib/discord";
import { DID } from "../atproto/did";
import { ensureUser, isAdmin } from "../user";
import { ReportReasonType } from "./report-shared";
import { createFrontPageLink, getRootUrl } from "./shared";

export type Report = InferSelectModel<typeof schema.Report>;

export const getReport = cache(
  async (reportId: number): Promise<Report | null> => {
    const adminUser = await isAdmin();

    if (!adminUser) {
      throw new Error("User is not an admin");
    }

    const [report] = await db
      .select()
      .from(schema.Report)
      .where(eq(schema.Report.id, reportId));

    return report ?? null;
  },
);

export const getModeratorReportStats = cache(async () => {
  const adminUser = await isAdmin();

  if (!adminUser) {
    throw new Error("User is not an admin");
  }

  const reports = await db.select().from(schema.Report);

  return {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    accepted: reports.filter((r) => r.status === "accepted").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };
});

export const getReports = cache(
  async (
    status: "pending" | "accepted" | "rejected" | null,
  ): Promise<Report[]> => {
    const adminUser = await isAdmin();

    if (!adminUser) {
      throw new Error("User is not an admin");
    }

    if (status) {
      return await db
        .select()
        .from(schema.Report)
        .where(eq(schema.Report.status, status));
    } else {
      return await db.select().from(schema.Report);
    }
  },
);

export const updateReport = async (
  reportId: number,
  status: "pending" | "accepted" | "rejected",
  actionedBy?: string,
) => {
  const adminUser = await isAdmin();

  if (!adminUser) {
    throw new Error("User is not an admin");
  }

  await db
    .update(schema.Report)
    .set({ status, actionedBy, actionedAt: new Date() })
    .where(eq(schema.Report.id, reportId));

  return;
};

type CreateReportOptions = {
  subjectUri: string;
  creatorComment: string;
  reportReason: ReportReasonType;
  subjectDid: DID;
  subjectCollection?: string;
  subjectRkey?: string;
  subjectCid?: string;
};

export const createReport = async ({
  subjectUri,
  subjectDid,
  subjectCollection,
  subjectRkey,
  subjectCid,
  creatorComment,
  reportReason,
}: CreateReportOptions) => {
  const user = await ensureUser();

  if (!user) {
    throw new Error("The user is not authenticated");
  }

  const createdBy = user.did;

  await db.insert(schema.Report).values({
    subjectUri,
    subjectDid,
    subjectCollection,
    subjectRkey,
    subjectCid,
    createdBy,
    createdAt: new Date(),
    creatorComment,
    reportReason,
    status: "pending",
  });

  const rootUrl = getRootUrl();

  await sendDiscordMessage({
    embeds: [
      {
        title: "New report on Frontpage",
        description: creatorComment ?? reportReason ?? "No reason provided",
        url: `${rootUrl}/moderation?status=pending`,
        color: 10181046,
        author: {
          name: createdBy,
          icon_url: "",
          url: `${rootUrl}/profile/${createdBy}`,
        },
        fields: [
          {
            name: "Link to post/comment/user",
            value: `${rootUrl}${await createFrontPageLink(subjectDid, subjectCollection, subjectRkey)}`,
          },
        ],
      },
    ],
  });
};
