import { ErrorBoundary } from "react-error-boundary";
import { JSONType, JSONValue } from "./atproto-json";
import { resolveIdentity } from "@/lib/atproto-server";
import { DidCollections } from "./collection-server";
import { Suspense } from "react";
import Link from "next/link";

export function CollapsedDidSummary({ did }: { did: string }) {
  return (
    <details>
      <summary>
        Author: <DidHandle did={did} />
      </summary>
      <Suspense>
        <ErrorBoundary
          fallback={<div>Failed to fetch collections for did: {did}.</div>}
        >
          <h2>Collections</h2>
          <DidCollections identifier={did} />
        </ErrorBoundary>
      </Suspense>
    </details>
  );
}

export async function DidDoc({ did }: { did: string }) {
  const identityResult = await resolveIdentity(did);
  if (!identityResult.success) {
    throw new Error(identityResult.error);
  }
  return (
    <JSONValue
      data={identityResult.didDocument as JSONType}
      repo={identityResult.didDocument.id}
    />
  );
}

export async function DidHandle({ did }: { did: string }) {
  const identityResult = await resolveIdentity(did);
  if (!identityResult.success) {
    throw new Error(identityResult.error);
  }

  const { handle, didDocument } = identityResult;

  return (
    <>
      {handle ? (
        <Link href={`/at/${handle}`}>{handle}</Link>
      ) : (
        "⚠️ Invalid Handle"
      )}{" "}
      (<Link href={`/at/${didDocument.id}`}>{didDocument.id}</Link>)
    </>
  );
}
