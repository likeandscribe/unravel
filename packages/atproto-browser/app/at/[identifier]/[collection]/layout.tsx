import { resolveIdentity } from "@/lib/atproto-server";
import { CollapsedDidSummary } from "@/app/at/_lib/did-components";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { identifier: string };
}) {
  const identityResult = await resolveIdentity(params.identifier);
  if (!identityResult.success) {
    return <div>🚨 {identityResult.error}</div>;
  }
  const didDocument = identityResult.didDocument;

  return (
    <div>
      <CollapsedDidSummary did={didDocument.id} />

      {children}
    </div>
  );
}
