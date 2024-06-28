import { getCommentWithChildren } from "@/lib/data/db/comment";
import { notFound } from "next/navigation";
import { Comment } from "../../_commentServer";
import { getPost } from "@/lib/data/db/post";
import Link from "next/link";
import { getDidFromHandleOrDid } from "@/lib/data/user";

type Params = {
  commentRkey: string;
  postRkey: string;
  postAuthor: string;
  commentAuthor: string;
};

export default async function CommentPage({ params }: { params: Params }) {
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
        postAuthorParam={params.postAuthor}
        postRkey={post.rkey}
        authorDid={comment.authorDid}
        createdAt={comment.createdAt}
        id={comment.id}
        comment={comment.body}
        childComments={comment.children}
      />
    </>
  );
}
