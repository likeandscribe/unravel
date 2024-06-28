/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { getPost } from "@/lib/data/db/post";
import { getCommentWithChildren } from "@/lib/data/db/comment";
import { notFound } from "next/navigation";
import { frontpageOgImageResponse } from "../../../../_og";

type Params = {
  postRkey: string;
  postAuthor: string;
  commentRkey: string;
  commentAuthor: string;
};

export const dynamic = "force-static";
export const revalidate = 60 * 60; // 1 hour

export async function GET(_req: Request, { params }: { params: Params }) {
  const [postAuthorDid, commentAuthorDid] = await Promise.all([
    getDidFromHandleOrDid(params.postAuthor),
    getDidFromHandleOrDid(params.commentAuthor),
  ]);
  if (!postAuthorDid || !commentAuthorDid) {
    notFound();
  }
  const post = await getPost(commentAuthorDid, params.postRkey);
  if (!post) {
    notFound();
  }

  const comment = await getCommentWithChildren(
    post.id,
    postAuthorDid,
    params.commentRkey,
  );
  if (!comment) {
    notFound();
  }

  return frontpageOgImageResponse(<div>Hello</div>);
}
