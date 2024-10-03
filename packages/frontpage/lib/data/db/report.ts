import "server-only";

import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { cache } from "react";
import { InferSelectModel, eq } from "drizzle-orm";
import { sendDiscordMessage } from "@/lib/discord";
import { DID } from "../atproto/did";
import { ensureUser, isAdmin } from "../user";

export const ReportReasons = ["spam", "misleading", "sexual", "other"] as const;
export type ReportReasonType = (typeof ReportReasons)[number];

export type ReportDTO = {
  actionedAt?: Date | null;
  actionedBy?: string | null;
  subjectUri: string;
  subjectDid: DID;
  subjectCollection?: string | null;
  subjectRkey?: string | null;
  subjectCid?: string | null;
  createdBy: DID;
  createdAt: Date;
  creatorComment?: string | null;
  reportReason?: ReportReasonType | null;
  status?: "pending" | "accepted" | "rejected" | null;
};

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

export const createReport = async (report: ReportDTO) => {
  const user = await ensureUser();

  if (!user) {
    throw new Error("The user is not authenticated");
  }

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
