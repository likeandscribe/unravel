"use server";

import { deletePost, ensureUser } from "@/lib/data";

export async function deletePostAction(rkey: string) {
  await deletePost(rkey);
}
