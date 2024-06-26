import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { PostCard } from "../../_components/post-card";
import { NewComment } from "./_comment";
import { Comment } from "./_commentServer";
import { DeletePostButton } from "./_delete-post-button";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { getUser } from "@/lib/data/user";
import { notFound } from "next/navigation";

type Params = {
  postRkey: string;
};

export default async function Post({ params }: { params: Params }) {
  const post = await getPost(params.postRkey);
  if (!post) {
    notFound();
  }
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      {post.status === "live" ? (
        <NewComment postRkey={post.rkey} />
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
