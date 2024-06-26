import { getCommentWithChildren } from "@/lib/data/db/comment";
import { notFound } from "next/navigation";
import { Comment } from "../_commentServer";
import { getPost } from "@/lib/data/db/post";
import Link from "next/link";

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
    <>
      <div className="flex justify-end">
        <Link
          href={`/post/${params.postRkey}`}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          See all comments
        </Link>
      </div>
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
    </>
  );
}
