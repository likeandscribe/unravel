"use server";

import { createComment, deletePost, ensureUser, getPost } from "@/lib/data";

export async function createCommentAction(formData: FormData) {
  const content = formData.get("comment") as string;
  const subjectRkey = formData.get("subjectRkey") as string;
  const post = await getPost(subjectRkey);
  if (!post) {
    throw new Error("Post not found");
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
