"use server";

import { createComment } from "@/lib/data/atproto/comment";
import { deletePost } from "@/lib/data/atproto/post";
import { getPost } from "@/lib/data/db/post";
import { ensureUser } from "@/lib/data/user";

export async function createCommentAction(formData: FormData) {
  const content = formData.get("comment") as string;
  const subjectRkey = formData.get("subjectRkey") as string;
  const post = await getPost(subjectRkey);
  if (!post) {
    throw new Error("Post not found");
  }
  const user = await ensureUser();

  if (post.status !== "live") {
    throw new Error(`[naughty] Cannot comment on deleted post. ${user.did}`);
  }

  await createComment({
    content,
    subjectRkey,
    subjectCid: post.cid,
    subjectCollection: "fyi.unravel.frontpage.post",
  });
}

export async function deletePostAction(rkey: string) {
  await deletePost(rkey);
}
