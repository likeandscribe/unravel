"use server";

import { getAtUriPath } from "@/lib/util";
import { AtUri } from "@atproto/syntax";
import { redirect } from "next/navigation";

export async function navigateUri(_state: unknown, formData: FormData) {
  let uri = formData.get("uri") as string;

  if (uri.startsWith("https://")) {
    const authority = uri.split("/")[4];
    const rkey = uri.split("/")[6];
    uri = `at://${authority}/app.bsky.feed.post/${rkey}`;
  }

  const atUri = new AtUri(uri);
  redirect(getAtUriPath(atUri));
}
