import "server-only";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import {
  getCommentWithChildren,
  shouldHideComment,
} from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { notFound } from "next/navigation";

export type CommentPageParams = {
  commentRkey: string;
  postRkey: string;
  postAuthor: string;
  commentAuthor: string;
};

export async function getCommentPageData(params: CommentPageParams) {
  const [postAuthorDid, commentAuthorDid] = await Promise.all([
    getDidFromHandleOrDid(params.postAuthor),
    getDidFromHandleOrDid(params.commentAuthor),
  ]);
  if (!postAuthorDid || !commentAuthorDid) {
    notFound();
  }
  const post = await getPost(postAuthorDid, params.postRkey);
  if (!post) {
    notFound();
  }

  const comment = await getCommentWithChildren(
    post.id,
    commentAuthorDid,
    params.commentRkey,
  );
  if (!comment) {
    notFound();
  }

  if (shouldHideComment(comment)) {
    notFound();
  }

  return { post, comment, postAuthorDid, commentAuthorDid };
}
