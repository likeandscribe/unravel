import { resolveIdentity } from "@repo/atproto-identity-next";
import { getHandle, getPds } from "@atproto/identity";
import Link from "next/link";
import { Suspense } from "react";
import { DidSummary } from "@/app/at/_lib/did-components";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { identifier: string };
}) {
  const identityResult = await resolveIdentity(params.identifier);
  if (!identityResult.success) {
    return <div>{identityResult.error}</div>;
  }
  const didDocument = identityResult.identity;
  const handle = getHandle(didDocument);
  if (!handle) {
    return <div>No handle found for DID: {didDocument.id}</div>;
  }
  const pds = getPds(didDocument);
  if (!pds) {
    return <div>No PDS found for DID: {didDocument.id}</div>;
  }

  return (
    <div>
      <details>
        <summary>
          Author: {handle} (
          <Link href={`/at/${didDocument.id}`}>{didDocument.id}</Link>)
        </summary>
        <Suspense>
          <DidSummary did={didDocument.id} />
        </Suspense>
      </details>

      {children}
    </div>
  );
}
