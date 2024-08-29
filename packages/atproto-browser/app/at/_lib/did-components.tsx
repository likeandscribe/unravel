import { ErrorBoundary } from "react-error-boundary";
import { JSONType, JSONValue } from "./atproto-json";
import { resolveIdentity } from "@/lib/atproto-server";
import { DidCollections } from "./collection-server";

export async function DidSummary({ did }: { did: string }) {
  return (
    <>
      <ErrorBoundary
        fallback={<div>Failed to fetch collections for {did}.</div>}
      >
        <h2>Collections</h2>
        <DidCollections did={did} />
      </ErrorBoundary>
      <h2>DID Doc</h2>
      <DidDoc did={did} />
    </>
  );
}
async function DidDoc({ did }: { did: string }) {
  const identityResult = await resolveIdentity(did);
  return <JSONValue data={identityResult as JSONType} repo={did} />;
}
