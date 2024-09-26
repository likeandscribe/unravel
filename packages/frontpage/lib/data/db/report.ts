import "server-only";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { cache } from "react";
import { InferSelectModel } from "drizzle-orm";

export const getReports = cache(async () => {
  const reports = await db.select().from(schema.Report);

  return reports;
});

type ReportInfer = InferSelectModel<typeof schema.Report>;

export const createReport = async (report: ReportInfer) => {
  await db.insert(schema.Report).values(report);

  //   await sendDiscordMessage({
  //     embeds: [
  //       {
  //         title: "New report on Frontpage",
  //         description:
  //           report.creatorComment ?? report.reportReason ?? "No reason provided",
  //         url: report.subjectUri,
  //         color: 10181046,
  //         author: {
  //           name: report.createdBy,
  //           icon_url: "",
  //           url: "",
  //         },
  //         fields: [
  //           {
  //             name: "Link",
  //             value: "https://frontpage.fyi/moderation",
  //           },
  //         ],
  //       },
  //     ],
  //   });
};
