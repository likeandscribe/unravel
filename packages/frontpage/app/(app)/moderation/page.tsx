import { CheckCircle, ExternalLink, Flag, Shield, XCircle } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";

type Report = {
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

type Community = {
  name: string;
  icon: string;
};

export default function Component() {
  const reports = [
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

  // const handleAction = (id: string, action: "approve" | "reject") => {
  //   setReports(
  //     reports.map((report) =>
  //       report.id === id ? { ...report, status: action } : report,
  //     ),
  //   );
  // };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
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
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-300">
                  {stats.approved}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-700 border-gray-600">
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
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.id} className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-blue-200 flex items-center justify-between">
                    <span>
                      Reported {report.type} in {report.community}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        report.status === "pending"
                          ? "bg-yellow-500 text-yellow-900"
                          : report.status === "approved"
                            ? "bg-green-500 text-green-900"
                            : "bg-red-500 text-red-900"
                      }`}
                    >
                      {report.status.charAt(0).toUpperCase() +
                        report.status.slice(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-100 mb-2">{report.content}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300 mb-4">
                    <div>
                      <strong>DID:</strong> {report.did}
                    </div>
                    <div className="hover:text-blue-200 ml-1 items-center overflow-hidden">
                      <strong>CID:</strong> {report.cid}
                    </div>
                    <div>
                      <strong>Record Key:</strong> {report.rkey}
                    </div>
                    <div>
                      <strong>URI:</strong>
                      <a
                        href={report.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 ml-1 inline-flex items-center flex-wrap"
                      >
                        {report.uri.substring(0, 30)}...
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-300 mb-4">
                    <Flag className="mr-2 h-4 w-4 text-red-400" />
                    <span>Reason: {report.reason}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="destructive"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
