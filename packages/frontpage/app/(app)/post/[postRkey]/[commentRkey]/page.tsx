import { getComment } from "@/lib/data/db/comment";
import { notFound } from "next/navigation";
import { Comment } from "../_commentServer";

type Params = {
  commentRkey: string;
  postRkey: string;
};

export default async function CommentPage({ params }: { params: Params }) {
  const comment = await getComment(params.commentRkey);
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
      childComments={[]}
    />
  );
}
