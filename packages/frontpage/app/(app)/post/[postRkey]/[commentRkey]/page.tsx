import { getCommentWithChildren } from "@/lib/data/db/comment";
import { notFound } from "next/navigation";
import { Comment } from "../_commentServer";
import { getPost } from "@/lib/data/db/post";

type Params = {
  commentRkey: string;
  postRkey: string;
};

export default async function CommentPage({ params }: { params: Params }) {
  const post = await getPost(params.postRkey);
  if (!post) {
    notFound();
  }
  const comment = await getCommentWithChildren(post.id, params.commentRkey);
  if (!comment) {
    notFound();
  }

  return (
    <Comment
      isUpvoted={false}
      key={comment.id}
      cid={comment.cid}
      rkey={comment.rkey}
      postRkey={params.postRkey}
      authorDid={comment.authorDid}
      createdAt={comment.createdAt}
      id={comment.id}
      comment={comment.body}
      childComments={comment.children}
    />
  );
}
