import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { NewComment } from "./_comment";
import { Comment } from "./_commentServer";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { notFound } from "next/navigation";
import { PostParams, resolvePostParams } from "./_post-params";

export default async function Post({ params }: { params: PostParams }) {
  const resolvedParams = await resolvePostParams(params);
  const post = await getPost(resolvedParams.authorDid, resolvedParams.postRkey);
  if (!post) {
    notFound();
  }
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      {post.status === "live" ? (
        <NewComment
          postRkey={post.rkey}
          postAuthor={resolvedParams.authorDid}
        />
      ) : (
        <Alert>
          <AlertTitle>This post has been deleted</AlertTitle>
          <AlertDescription>
            Deleted posts cannot receive new comments.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6">
        {comments.map((comment) => (
          <Comment
            isUpvoted={comment.userHasVoted}
            key={comment.id}
            cid={comment.cid}
            rkey={comment.rkey}
            postRkey={post.rkey}
            authorDid={comment.authorDid}
            postAuthorDid={resolvedParams.authorDid}
            createdAt={comment.createdAt}
            id={comment.id}
            comment={comment.body}
            childComments={comment.children}
          />
        ))}
      </div>
    </>
  );
}
