import { resolveIdentity } from "@/lib/atproto-server";
import { getPds } from "@atproto/identity";
import Link from "@/lib/link";
import { describeRepo } from "@/lib/atproto";

export async function DidCollections({ identifier }: { identifier: string }) {
  const identityResult = await resolveIdentity(identifier);
  if (!identityResult.success) {
    throw new Error(`Could not resolve identity: ${identifier}`);
  }
  const didDocument = identityResult.didDocument;
  const pds = getPds(didDocument);
  if (!pds) {
    throw new Error(`No PDS found for DID: ${didDocument.id}`);
  }

  const { collections } = (await describeRepo(pds, didDocument.id))!;

  return (
    <ul>
      {collections.length === 0 ? (
        <p>No collections.</p>
      ) : (
        collections.map((nsid) => {
          return (
            <li key={nsid}>
              <Link href={`/at/${identifier}/${nsid}`} prefetch={false}>
                {nsid}
              </Link>
            </li>
          );
        })
      )}
    </ul>
  );
}
