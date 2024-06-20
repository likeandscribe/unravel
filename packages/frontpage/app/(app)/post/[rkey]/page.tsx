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
  rkey: string;
};

export default async function Item({ params }: { params: Params }) {
  getUser(); // Prefetch user
  const post = await getPost(params.rkey);
  if (!post) {
    notFound();
  }
  const user = await getUser();
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      <title>{post.title}</title>
      <main className="mx-auto max-w-4xl space-y-6">
        <PostCard
          author={post.authorDid}
          createdAt={post.createdAt}
          id={post.id}
          commentCount={post.commentCount}
          title={post.title}
          url={post.url}
          votes={post.voteCount}
          rkey={post.rkey}
          cid={post.cid}
          isUpvoted={post.userHasVoted}
        />
        {user?.did === post.authorDid && (
          <div className="flex justify-end">
            <DeletePostButton rkey={params.rkey} />
          </div>
        )}
        {post.status === "live" ? (
          <NewComment parentRkey={post.rkey} />
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
              author={comment.authorDid}
              createdAt={comment.createdAt}
              id={comment.id}
              comment={comment.body}
            />
          ))}
        </div>
      </main>
    </>
  );
}
