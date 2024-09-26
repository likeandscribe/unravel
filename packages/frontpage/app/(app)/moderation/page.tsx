"use server";

import { hasRole } from "@/lib/data/user";
import { redirect } from "next/navigation";
import ModerationPage from "./client";

export type Report = {
  id: number;
  actionedAt?: Date;
  actionedBy?: string;
  subjectUri: string;
  subjectDid: string;
  subjectCollection?: string;
  subjectRkey?: string;
  subjectCid?: string;
  createdBy: string;
  createdAt: Date;
  creatorComment?: string;
  reportReason?: string;
  status: "pending" | "accepted" | "rejected";
};

const reports: Report[] = [
  {
    id: 1,
    actionedAt: new Date("2023-10-01T12:00:00Z"),
    actionedBy: "moderator1",
    subjectUri: "uri1",
    subjectDid: "did1",
    subjectCollection: "collection1",
    subjectRkey: "rkey1",
    subjectCid: "cid1",
    createdBy: "user1",
    createdAt: new Date("2023-09-30T12:00:00Z"),
    creatorComment: "This is a comment by the creator.",
    status: "accepted",
  },
  {
    id: 2,
    actionedAt: new Date("2023-10-02T12:00:00Z"),
    actionedBy: "moderator2",
    subjectUri: "uri2",
    subjectDid: "did2",
    subjectCollection: "collection2",
    subjectRkey: "rkey2",
    subjectCid: "cid2",
    createdBy: "user2",
    createdAt: new Date("2023-09-29T12:00:00Z"),
    creatorComment: "This is another comment by the creator.",
    status: "rejected",
  },
  {
    id: 3,
    subjectUri: "uri3",
    subjectDid: "did3",
    createdBy: "user3",
    createdAt: new Date("2023-09-28T12:00:00Z"),
    status: "pending",
  },
  {
    id: 4,
    subjectUri: "uri4",
    subjectDid: "did4",
    subjectCollection: "collection4",
    createdBy: "user4",
    createdAt: new Date("2023-09-27T12:00:00Z"),
    creatorComment: "Yet another comment by the creator.",
    status: "pending",
  },
  {
    id: 5,
    subjectUri: "uri5",
    subjectDid: "did5",
    subjectRkey: "rkey5",
    createdBy: "user5",
    createdAt: new Date("2023-09-26T12:00:00Z"),
    status: "pending",
  },
];

const stats = {
  total: reports.length,
  pending: reports.filter((r) => r.status === "pending").length,
  accepted: reports.filter((r) => r.status === "accepted").length,
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
