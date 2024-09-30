"use server";
import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/lib/components/ui/card";
import { DID } from "@/lib/data/atproto/did";
import { Report } from "@/lib/data/db/report";
import { performModerationAction } from "../page";
import { UserHandle } from "./user-handle";
import { PostCollection } from "@/lib/data/atproto/post";
import { CommentCollection } from "@/lib/data/atproto/comment";
import Link from "next/link";
import { getPostFromComment } from "@/lib/data/db/post";

const statusClasses = {
  pending: "bg-yellow-500 text-yellow-900",
  accepted: "bg-green-500 text-green-900",
  rejected: "bg-red-500 text-red-900",
};

const createLink = async (
  collection?: string | null,
  author?: DID | null,
  rkey?: string | null,
) => {
  if (collection === PostCollection) {
    return `/post/${author}/${rkey}/`;
  } else if (collection === CommentCollection) {
    console.log(rkey, author);
    const { postRkey, postAuthor } = (await getPostFromComment({
      rkey: rkey!,
      did: author!,
    }))!;
    console.log(postRkey, postAuthor);
    return `/post/${postAuthor}/${postRkey}/${author}/${rkey}/`;
  } else {
    return `/profile/${author}/`;
  }
};

export async function ReportCard({ report }: { report: Report }) {
  return (
    <Card className="dark:bg-gray-700 border-gray-600 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between text-blue-400">
          <p>Reported {report.subjectCollection}</p>
          <p
            className={`px-2 py-1 rounded-full text-xs 
              ${
                report.status
                  ? statusClasses[report.status]
                  : "bg-red-500 text-red-900"
              }`}
          >
            {report.status}
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col mb-4 gap-1 flex-wrap">
          <p>
            <strong className="mr-2">Reason:</strong>
            {report.reportReason}
          </p>
          <p>
            <strong className="mr-2">Reported By:</strong>
            <UserHandle userDid={report.createdBy as DID} />
          </p>
          <p>
            <strong className="mr-2">Comment:</strong>
            {report.creatorComment}
          </p>
        </div>
        {report.actionedAt ? (
          <div className="mb-2 flex flex-row gap-5">
            <p>
              <strong className="mr-2">Actioned at:</strong>
              <span className="italic">
                {report.actionedAt.toLocaleString()}
              </span>
            </p>
            <p>
              <strong className="mr-2">Actioned By:</strong>

              <UserHandle userDid={report.actionedBy as DID} />
            </p>
          </div>
        ) : null}
        <div className="flex">
          <form>
            <Button
              variant="success"
              type="submit"
              className="mr-2"
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
              formAction={performModerationAction.bind(null, {
                reportId: report.id,
                status: "rejected",
              })}
            >
              Reject
            </Button>
          </form>
          <Link
            className="ml-2"
            href={await createLink(
              report.subjectCollection,
              report.subjectDid as DID,
              report.subjectRkey,
            )}
            target="_blank"
          >
            <Button variant="outline" type="button">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
