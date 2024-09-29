import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/lib/components/ui/card";
import { DID } from "@/lib/data/atproto/did";
import { Report } from "@/lib/data/db/report";
import { ExternalLink, Flag } from "lucide-react";
import { performModerationAction } from "../page";
import { UserHandle } from "./user-handle";

export async function ReportCard({ report }: { report: Report }) {
  return (
    <Card className="bg-gray-700 border-gray-600 mb-4">
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
  );
}
