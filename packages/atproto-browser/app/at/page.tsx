import { getAtUriPath } from "@/lib/util";
import { AtUri } from "@atproto/syntax";
import { redirect } from "next/navigation";

export default function AtPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const uri = new AtUri(searchParams.u!);
  redirect(getAtUriPath(uri));
}
