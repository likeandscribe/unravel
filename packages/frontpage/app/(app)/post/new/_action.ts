"use server";

import { PdsError, createPost } from "@/lib/data";

export async function newPostAction(_prevState: unknown, formData: FormData) {
  "use server";
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
    await createPost({ title, url });
  } catch (error) {
    if (!(error instanceof PdsError)) throw error;
    return { error: "Failed to create post" };
  }
}
