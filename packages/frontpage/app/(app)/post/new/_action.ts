"use server";

import { DID } from "@/lib/data/atproto/did";
import { getVerifiedHandle } from "@/lib/data/atproto/identity";
import { createPost } from "@/lib/data/atproto/post";
import { uncached_doesPostExist } from "@/lib/data/db/post";
import { DataLayerError } from "@/lib/data/error";
import { ensureUser } from "@/lib/data/user";
import { redirect } from "next/navigation";

export async function newPostAction(_prevState: unknown, formData: FormData) {
  "use server";
  const user = await ensureUser();
  const title = formData.get("title");
  let url = formData.get("url") as string;

  if (typeof title !== "string" || typeof url !== "string" || !title || !url) {
    return { error: "Provide a title and url." };
  }

  if (title.length > 120) {
    return { error: "Title too long" };
  }

  const allowedProtocols = ["http", "https", "at"];
  const protocolRegex = new RegExp(`^(${allowedProtocols.join("|")}):\/\/`);

  if (!protocolRegex.test(url)) {
    url = `https://${url}`;
  }

  if (!URL.canParse(url)) {
    return { error: "Invalid URL" };
  }

  try {
    const { rkey } = await createPost({ title, url });
    const [handle] = await Promise.all([
      getVerifiedHandle(user.did),
      waitForPost(user.did, rkey),
    ]);
    redirect(`/post/${handle}/${rkey}`);
  } catch (error) {
    if (!(error instanceof DataLayerError)) throw error;
    return { error: "Failed to create post" };
  }
}

const MAX_POLLS = 10;
async function waitForPost(authorDid: DID, rkey: string) {
  let exists = false;
  let polls = 0;
  while (!exists && polls < MAX_POLLS) {
    exists = await uncached_doesPostExist(authorDid, rkey);
    await new Promise((resolve) => setTimeout(resolve, 250));
    polls++;
  }
}
