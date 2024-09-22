import "server-only";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/identity";
import { getPost } from "@/lib/data/db/post";
import { notFound } from "next/navigation";

export type PostPageParams = {
  postAuthor: string;
  postRkey: string;
};

export async function getPostPageData(params: PostPageParams) {
  const authorDid = await getDidFromHandleOrDid(params.postAuthor);
  if (!authorDid) {
    notFound();
  }
  const post = await getPost(authorDid, params.postRkey);
  if (!post) {
    notFound();
  }

  return { post, authorDid };
}
