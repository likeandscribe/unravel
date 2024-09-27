import { ExternalLink, Flag, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
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
import { getVerifiedHandle } from "@/lib/data/atproto/identity";
import { UserHandle } from "./_user-handle";
import { DID } from "@/lib/data/atproto/did";

export async function performModerationAction(
  input: { reportId: number; status: "accepted" | "rejected" },
  _: FormData,
) {
  "use server";
  console.log("creating moderation action");
  console.log("input", input);
  const user = await ensureUser();
  const report = await getReport(input.reportId);

  if (!report) {
    throw new Error("Report not found");
  }

  const newModEvent: ModerationEventDTO = {
    subjectUri: report.subjectUri,
    subjectDid: report.subjectDid,
    createdBy: user.did,
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

  await Promise.all([
    createModerationEvent(newModEvent),
    updateReport(report.id, input.status, user.did),
  ]);

  revalidatePath("/moderation");
  return;
}

export default async function Moderation({
  searchParams,
}: {
  searchParams: { status: string };
}) {
  const status =
    (searchParams.status as "pending" | "accepted" | "rejected") ?? null;

  const reports = await getReports(status).then((reports) =>
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );

  const stats = await getModeratorReportStats();
  // const stats = {
  //   total: reports.length,
  //   pending: reports.filter((r) => r.status === "pending").length,
  //   accepted: reports.filter((r) => r.status === "accepted").length,
  //   rejected: reports.filter((r) => r.status === "rejected").length,
  // };

  if (await isAdmin()) {
    return (
      <>
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-blue-300">
              <Shield className="h-6 w-6" />
              Moderation Dashboard
            </CardTitle>
            <CardDescription className="text-gray-300">
              Review and take action on reported content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Link href="/moderation">
                <Card className="bg-gray-700 border-gray-600">
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
              <Link href="/moderation?status=pending">
                <Card className="bg-gray-700 border-gray-600">
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
              <Link href="/moderation?status=accepted">
                <Card className="bg-gray-700 border-gray-600">
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

              <Link href="/moderation?status=rejected">
                <Card className={`bg-gray-700 border-gray-600 `}>
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
            </div>
          </CardContent>
        </Card>
        {reports.map((report) => (
          <Card
            key={report.subjectCid}
            className="bg-gray-700 border-gray-600 mb-4"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-blue-200 flex items-center justify-between">
                <span>Reported Item</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    report.status === "pending"
                      ? "bg-yellow-500 text-yellow-900"
                      : report.status === "accepted"
                        ? "bg-green-500 text-green-900"
                        : "bg-red-500 text-red-900"
                  }`}
                >
                  {report.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300 mb-4">
                <div>
                  <strong>URI:</strong>
                  <a
                    href={report.subjectUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 ml-1 inline-flex items-center flex-wrap"
                  >
                    {report.subjectUri.substring(0, 30)}...
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-300 mb-4">
                <Flag className="mr-2 h-4 w-4 text-red-400" />
                <span>Reason: {report.creatorComment}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300 mb-4">
                <div>
                  <strong>Reported By: </strong>
                  <UserHandle userDid={report.createdBy as DID} />
                </div>
                <div>
                  <strong>Reported Reason: </strong> {report.creatorComment}
                </div>
              </div>
              <form>
                <Button
                  variant="success"
                  type="submit"
                  className="mr-2"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  formAction={performModerationAction.bind(null, {
                    reportId: report.id,
                    status: "accepted",
                  })}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  type="submit"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  formAction={performModerationAction.bind(null, {
                    reportId: report.id,
                    status: "rejected",
                  })}
                >
                  Reject
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </>
    );
  } else {
    redirect("/");
  }
}
