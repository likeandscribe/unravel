"use server";

import { CreatePostError, createPost, ensureUser } from "@/lib/data";
import { redirect } from "next/navigation";

export async function newPostAction(_prevState: unknown, formData: FormData) {
  "use server";
  await ensureUser();
  const title = formData.get("title");
  const url = formData.get("url");

  if (typeof title !== "string" || typeof url !== "string" || !title || !url) {
    return { error: "Provide a title and url." };
  }

  if (title.length > 120) {
    return { error: "Title too long" };
  }

  if (!URL.canParse(url)) {
    return { error: "Invalid URL" };
  }

  try {
    const { rkey } = await createPost({ title, url });
    redirect(`/post/${rkey}`);
  } catch (error) {
    if (!(error instanceof CreatePostError)) throw error;
    return { error: "Failed to create post" };
  }
}
