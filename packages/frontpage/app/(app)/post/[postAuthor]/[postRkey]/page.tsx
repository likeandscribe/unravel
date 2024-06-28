import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { NewComment } from "./_comment";
import { Comment } from "./_commentServer";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { notFound } from "next/navigation";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";

type Params = {
  postAuthor: string;
  postRkey: string;
};

export default async function Post({ params }: { params: Params }) {
  const didParam = await getDidFromHandleOrDid(params.postAuthor);
  if (!didParam) {
    notFound();
  }
  const post = await getPost(didParam, params.postRkey);
  if (!post) {
    notFound();
  }
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      {post.status === "live" ? (
        <NewComment postRkey={post.rkey} postAuthorDid={didParam} />
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
            postAuthorParam={params.postAuthor}
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
