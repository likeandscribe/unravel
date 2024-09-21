"use server";

import { hasRole } from "@/lib/data/user";
import { redirect } from "next/navigation";
import ModerationPage from "./_client";

export type Report = {
  id: string;
  type: "post" | "comment";
  content: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  did: string;
  cid: string;
  rkey: string;
  uri: string;
  community: string;
};

const reports: Report[] = [
  {
    id: "1",
    type: "post",
    content: "This is a reported post",
    reason: "Inappropriate content",
    status: "pending",
    did: "did:plc:abcdefghijklmnop",
    cid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    rkey: "abcdef123456",
    uri: "at://did:plc:abcdefghijklmnop/app.bsky.feed.post/abcdef123456",
    community: "General",
  },
  {
    id: "2",
    type: "comment",
    content: "This is a reported comment",
    reason: "Spam",
    status: "pending",
    did: "did:plc:qrstuvwxyz123456",
    cid: "bafybeihbgxvydgnxlfapxnzb7zyqbbs6tkvhflemvwogzb5zzp7ufuz7ky",
    rkey: "ghijkl789012",
    uri: "at://did:plc:qrstuvwxyz123456/app.bsky.feed.post/ghijkl789012",
    community: "Tech",
  },
  {
    id: "3",
    type: "post",
    content: "Another reported post",
    reason: "Misinformation",
    status: "pending",
    did: "did:plc:123456abcdefghij",
    cid: "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xccnlnmzhe5h6y7afcvqpqom",
    rkey: "mnopqr456789",
    uri: "at://did:plc:123456abcdefghij/app.bsky.feed.post/mnopqr456789",
    community: "Science",
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
