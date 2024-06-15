"use server";

import { createComment, deletePost, ensureUser, getPost } from "@/lib/data";

export async function createCommentAction(formData: FormData) {
  const content = formData.get("comment") as string;
  const subjectRkey = formData.get("subjectRkey") as string;

  await createComment({ content, subjectRkey });
}

export async function deletePostAction(rkey: string) {
  await deletePost(rkey);
}
