"use server";

import { getAtUriPath } from "@/lib/util";
import { AtUri } from "@atproto/syntax";
import { redirect } from "next/navigation";

export async function navigateUri(_state: unknown, formData: FormData) {
  const uri = new AtUri(formData.get("uri") as string);
  redirect(getAtUriPath(uri));
}
