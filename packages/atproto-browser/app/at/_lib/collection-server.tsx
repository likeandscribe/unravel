import { resolveIdentity } from "@/lib/atproto-server";
import { getPds } from "@atproto/identity";
import Link from "next/link";

export async function DidCollections({ did }: { did: string }) {
  const identityResult = await resolveIdentity(did);
  if (!identityResult.success) {
    throw new Error(`Could not resolve DID: ${did}`);
  }
  const didDocument = identityResult.identity;
  const pds = getPds(didDocument);
  if (!pds) {
    throw new Error(`No PDS found for DID: ${didDocument.id}`);
  }

  const describeRepoUrl = new URL(`${pds}/xrpc/com.atproto.repo.describeRepo`);
  describeRepoUrl.searchParams.set("repo", didDocument.id);
  const response = await fetch(describeRepoUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch collections: ${response.statusText}. URL: ${describeRepoUrl.toString()}`,
    );
  }

  const { collections } = (await response.json()) as {
    collections: string[];
  };

  return (
    <ul>
      {collections.length === 0 ? (
        <p>No collections.</p>
      ) : (
        collections.map((nsid) => {
          return (
            <li key={nsid}>
              <Link href={`/at/${did}/${nsid}`}>{nsid}</Link>
            </li>
          );
        })
      )}
    </ul>
  );
}
