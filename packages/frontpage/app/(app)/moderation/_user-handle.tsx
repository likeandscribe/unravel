import { DID } from "@/lib/data/atproto/did";
import { getVerifiedHandle } from "@/lib/data/atproto/identity";
import Link from "next/link";

export async function UserHandle({ userDid }: { userDid: DID }) {
  const handle = (await getVerifiedHandle(userDid)) ?? userDid;

  return (
    <Link href={`/profile/${handle}`} className="underline">
      {handle}
    </Link>
  );
}
