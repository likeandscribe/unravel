import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { ensureUser, isAdmin as isAdmin } from "@/lib/data/user";
import { redirect } from "next/navigation";
import {
  getModeratorReportStats,
  getReport,
  getReports,
  updateReport,
} from "@/lib/data/db/report";
import {
  ModerationEventDTO,
  createModerationEvent,
} from "@/lib/data/db/moderation";
import { PostCollection } from "@/lib/data/atproto/post";
import { CommentCollection } from "@/lib/data/atproto/comment";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ReportCard } from "./_components/report-card";
import { moderatePost } from "@/lib/data/db/post";
import { DID } from "@/lib/data/atproto/did";
import { moderateComment } from "@/lib/data/db/comment";
import { moderateUser } from "@/lib/data/db/user";

export async function performModerationAction(
  input: { reportId: number; status: "accepted" | "rejected" },
  _: FormData,
) {
  "use server";
  const user = await ensureUser();
  const report = await getReport(input.reportId);

  if (!report) {
    throw new Error("Report not found");
  }

  const newModEvent: ModerationEventDTO = {
    subjectUri: report.subjectUri,
    subjectDid: report.subjectDid as DID,
    createdBy: user.did as DID,
    createdAt: new Date(),
    labelsAdded: report.reportReason,
    creatorReportReason: report.creatorComment,
  };

  if (report.subjectCollection) {
    if (report.subjectCollection === PostCollection) {
      newModEvent.subjectCollection = PostCollection;
    } else if (report.subjectCollection === CommentCollection) {
      newModEvent.subjectCollection = CommentCollection;
    }

    newModEvent.subjectRkey = report.subjectRkey;
    newModEvent.subjectCid = report.subjectCid;
  }

  const modAction = async () => {
    switch (report.subjectCollection) {
      case PostCollection:
        return await moderatePost({
          rkey: report.subjectRkey!,
          authorDid: report.subjectDid! as DID,
          cid: report.subjectCid!,
          hide: input.status === "accepted",
        });

      case CommentCollection:
        return await moderateComment({
          rkey: report.subjectRkey!,
          authorDid: report.subjectDid! as DID,
          cid: report.subjectCid!,
          hide: input.status === "accepted",
        });

      default:
        return await moderateUser({
          userDid: report.subjectDid as DID,
          hide: input.status === "accepted",
          label: report.reportReason,
        });
    }
  };

  await Promise.all([
    createModerationEvent(newModEvent),
    updateReport(report.id, input.status, user.did),
    modAction(),
  ]);

  revalidatePath("/moderation");
  return;
}

type StatusTypes = "pending" | "accepted" | "rejected";

export default async function Moderation(props: {
  searchParams: Promise<{ status: string }>;
}) {
  const searchParams = await props.searchParams;
  if (!(await isAdmin())) {
    redirect("/");
  }

  const status = (searchParams.status as StatusTypes) ?? null;

  const reportList = await getReports(status);

  const reports = reportList.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const stats = await getModeratorReportStats();

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="flex justify-evenly text-center">
          <CardTitle className="text-2xl font-bold text-blue-300">
            Moderation Dashboard
          </CardTitle>
          <CardDescription className="text-gray-300">
            Review and take action on reported content
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap">
          <Link href="/moderation" className="flex-1">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-300">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/moderation?status=pending" className="flex-1">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-300">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/moderation?status=accepted" className="flex-1">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Accepted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-300">
                  {stats.accepted}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/moderation?status=rejected" className="flex-1">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-300">
                  {stats.rejected}
                </div>
              </CardContent>
            </Card>
          </Link>
        </CardContent>
      </Card>
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </>
  );
}
