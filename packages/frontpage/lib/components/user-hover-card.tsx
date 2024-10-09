import { HoverCard } from "@/lib/components/ui/hover-card";
import { DID } from "../data/atproto/did";
import { getVerifiedHandle } from "../data/atproto/identity";
import { UserHoverCardClient } from "./user-hover-card-client";
import { ensureUser } from "../data/user";
import { parseReportForm } from "../data/db/report-shared";
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
        did={did}
        asChild={asChild}
        initialHandle={handle ?? ""}
        reportAction={reportUserAction.bind(null, { did })}
      >
        {children}
      </UserHoverCardClient>
    </HoverCard>
  );
}

export async function reportUserAction(
  input: {
    did: DID;
  },
  formData: FormData,
) {
  "use server";
  await ensureUser();

  const formResult = parseReportForm(formData);
  if (!formResult.success) {
    throw new Error("Invalid form data");
  }

  await createReport({
    ...formResult.data,
    subjectUri: `at://${input.did}`,
    subjectDid: input.did,
  });
}
