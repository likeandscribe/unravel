import { getAtUriPath } from "@/lib/util";
import { AtUri } from "@atproto/syntax";
import { redirect } from "next/navigation";

export function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  console.log(searchParams.get("u"));
  const uri = new AtUri(searchParams.get("u")!);
  redirect(getAtUriPath(uri));
}
