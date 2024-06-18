"use server";

import {
  CreatePostError,
  createPost,
  ensureUser,
  uncached_doesPostExist,
} from "@/lib/data";
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
    await waitForPost(rkey);
    redirect(`/post/${rkey}`);
  } catch (error) {
    if (!(error instanceof CreatePostError)) throw error;
    return { error: "Failed to create post" };
  }
}

const MAX_POLLS = 10;
async function waitForPost(rkey: string) {
  let exists = false;
  let polls = 0;
  while (!exists && polls < MAX_POLLS) {
    exists = await uncached_doesPostExist(rkey);
    await new Promise((resolve) => setTimeout(resolve, 250));
    polls++;
  }
}
