"use server";

import { hasRole } from "@/lib/data/user";
import { redirect } from "next/navigation";
import ModerationPage from "./client";

export type Report = {
  id: number;
  actionedAt?: string; // Optional field
  actionedBy?: string; // Optional field
  subjectUri: string;
  subjectDid: string;
  subjectCollection?: string; // Optional field
  subjectRkey?: string; // Optional field
  subjectCid?: string; // Optional field
  createdBy: string;
  createdAt: string;
  creatorComment?: string; // Optional field
  labelsAdded?: string; // Optional field
  //TODO: add a type field to the report schema so you know if it's a post, comment or user report
  //TODO: add a status field to the report schema so you know if it's pending, approved or rejected
  type: "post" | "comment" | "user"; // New field to indicate the type of report
  status: "pending" | "approved" | "rejected"; // New field to indicate the status of the report
};

const reports: Report[] = [
  {
    id: 1,
    actionedAt: "2023-10-01T12:00:00Z",
    actionedBy: "moderator1",
    subjectUri: "uri1",
    subjectDid: "did1",
    subjectCollection: "collection1",
    subjectRkey: "rkey1",
    subjectCid: "cid1",
    createdBy: "user1",
    createdAt: "2023-09-30T12:00:00Z",
    creatorComment: "This is a comment by the creator.",
    labelsAdded: "label1,label2",
    type: "post",
    status: "approved",
  },
  {
    id: 2,
    actionedAt: "2023-10-02T12:00:00Z",
    actionedBy: "moderator2",
    subjectUri: "uri2",
    subjectDid: "did2",
    subjectCollection: "collection2",
    subjectRkey: "rkey2",
    subjectCid: "cid2",
    createdBy: "user2",
    createdAt: "2023-09-29T12:00:00Z",
    creatorComment: "This is another comment by the creator.",
    labelsAdded: "label3,label4",
    type: "comment",
    status: "rejected",
  },
  {
    id: 3,
    subjectUri: "uri3",
    subjectDid: "did3",
    createdBy: "user3",
    createdAt: "2023-09-28T12:00:00Z",
    type: "user",
    status: "pending",
  },
  {
    id: 4,
    subjectUri: "uri4",
    subjectDid: "did4",
    subjectCollection: "collection4",
    createdBy: "user4",
    createdAt: "2023-09-27T12:00:00Z",
    creatorComment: "Yet another comment by the creator.",
    type: "post",
    status: "pending",
  },
  {
    id: 5,
    subjectUri: "uri5",
    subjectDid: "did5",
    subjectRkey: "rkey5",
    createdBy: "user5",
    createdAt: "2023-09-26T12:00:00Z",
    labelsAdded: "label5,label6",
    type: "comment",
    status: "approved",
  },
];

const stats = {
  total: reports.length,
  pending: reports.filter((r) => r.status === "pending").length,
  approved: reports.filter((r) => r.status === "approved").length,
  rejected: reports.filter((r) => r.status === "rejected").length,
};

export default async function Moderation() {
  //TODO: get moderation reports, get moderator's stats etc.
  if (await hasRole("moderator")) {
    // const [reports, stats] = await Promise.all([
    //     await getReports(),
    //     await getStats(did),
    // ]);

    return <ModerationPage reports={reports} stats={stats} />;
  } else {
    redirect("/");
  }
}
