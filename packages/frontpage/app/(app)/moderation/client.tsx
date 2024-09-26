"use client";
import { ExternalLink, Flag, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Report } from "./page";
import { useActionState, useState } from "react";
import { createModerationAction } from "./actions";

export default function ModerationPage({
  reports,
  stats,
}: {
  reports: Report[];
  stats: { total: number; pending: number; accepted: number; rejected: number };
}) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [_, action, isPending] = useActionState(createModerationAction, null);

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
            <Card
              className={`bg-gray-700 border-gray-600 ${selectedTab === "all" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedTab("all")}
            >
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
            <Card
              className={`bg-gray-700 border-gray-600 ${selectedTab === "pending" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedTab("pending")}
            >
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
            <Card
              className={`bg-gray-700 border-gray-600 ${selectedTab === "accepted" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedTab("accepted")}
            >
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
            <Card
              className={`bg-gray-700 border-gray-600 ${selectedTab === "rejected" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedTab("rejected")}
            >
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
          </div>
        </CardContent>
      </Card>
      {reports
        .filter(
          (report) => selectedTab === "all" || report.status === selectedTab,
        )
        .map((report) => (
          <>
            <form action={action}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-blue-200">
                    {isPending ?? "Report Actions????"} Report Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300 mb-4">
                    <div>
                      <strong>Reported By:</strong> {report.createdBy}
                    </div>
                    <div>
                      <strong>Reported Reason:</strong> {report.creatorComment}
                    </div>
                  </div>
                </CardContent>
                <button
                  type="submit"
                  className="bg-green-500 text-green-900 px-4 py-2 rounded-lg"
                >
                  Approve
                </button>
              </Card>
            </form>
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
                <p className="text-gray-100 mb-2">{report.creatorComment}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300 mb-4">
                  <div>
                    <strong>DID:</strong> {report.subjectDid}
                  </div>
                  <div className="hover:text-blue-200 ml-1 items-center overflow-hidden">
                    <strong>CID:</strong> {report.subjectCid}
                  </div>
                  <div>
                    <strong>Record Key:</strong> {report.subjectRkey}
                  </div>
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
              </CardContent>
            </Card>
          </>
        ))}
    </>
  );
}