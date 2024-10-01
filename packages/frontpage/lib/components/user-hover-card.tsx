import { UserAvatar } from "./user-avatar";
import { HoverCard } from "@/lib/components/ui/hover-card";
import { DID } from "../data/atproto/did";
import { getVerifiedHandle } from "../data/atproto/identity";
import { UserHoverCardClient } from "./user-hover-card-client";
import { ensureUser } from "../data/user";
import { ReportReason } from "../constants";
import { createReport } from "../data/db/report";

type Props = {
  did: DID;
  children: React.ReactNode;
  asChild?: boolean;
};

export async function UserHoverCard({ did, children, asChild }: Props) {
  // Fetch this early on the server because it's almost certainly already cached this request
  const handle = await getVerifiedHandle(did);
  return (
    <HoverCard>
      <UserHoverCardClient
        avatar={<UserAvatar did={did} size="medium" />}
        did={did}
        asChild={asChild}
        initialHandle={handle ?? ""}
        reportAction={ReportUserAction.bind(null, { did })}
      >
        {children}
      </UserHoverCardClient>
    </HoverCard>
  );
}

export async function ReportUserAction(
  input: {
    did: DID;
  },
  formData: FormData,
) {
  "use server";
  const user = await ensureUser();

  const creatorComment = formData.get("creatorComment") as string;
  const reportReason = formData.get("reportReason") as ReportReason;

  if (
    typeof creatorComment !== "string" ||
    !reportReason ||
    creatorComment.length >= 250
  ) {
    throw new Error("Missing creatorComment or reportReason");
  }

  await createReport({
    subjectUri: `at://${input.did}`,
    subjectDid: input.did,
    createdBy: user.did,
    createdAt: new Date(),
    creatorComment,
    reportReason,
    status: "pending",
  });
}
