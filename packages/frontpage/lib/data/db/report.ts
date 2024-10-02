import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { cache } from "react";
import { InferSelectModel, eq } from "drizzle-orm";
import { sendDiscordMessage } from "@/lib/discord";

export enum ReportReason {
  SPAM = "spam",
  MISLEADING = "misleading",
  SEXUAL = "sexual",
  OTHER = "other",
}

export type ReportDTO = {
  actionedAt?: Date | null;
  actionedBy?: string | null;
  subjectUri: string;
  subjectDid: string;
  subjectCollection?: string | null;
  subjectRkey?: string | null;
  subjectCid?: string | null;
  createdBy: string;
  createdAt: Date;
  creatorComment?: string | null;
  reportReason?: ReportReason | null;
  status?: "pending" | "accepted" | "rejected" | null;
};

export type Report = InferSelectModel<typeof schema.Report>;

export const getReport = cache(
  async (reportId: number): Promise<Report | null> => {
    const [report] = await db
      .select()
      .from(schema.Report)
      .where(eq(schema.Report.id, reportId));

    return report ?? null;
  },
);

export const getModeratorReportStats = cache(async () => {
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
  await db
    .update(schema.Report)
    .set({ status, actionedBy, actionedAt: new Date() })
    .where(eq(schema.Report.id, reportId));

  return;
};

export const createReport = async (report: ReportDTO) => {
  await db.insert(schema.Report).values(report);

  await sendDiscordMessage({
    embeds: [
      {
        title: "New report on Frontpage",
        description:
          report.creatorComment ?? report.reportReason ?? "No reason provided",
        url: report.subjectUri,
        color: 10181046,
        author: {
          name: report.createdBy,
          icon_url: "",
          url: "",
        },
        fields: [
          {
            name: "Link",
            value: "https://frontpage.fyi/moderation",
          },
        ],
      },
    ],
  });
};
