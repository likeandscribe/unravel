import { PostCard } from "../../_components/post-card";
import { NewComment, CommentClient } from "./_comment";
import { Comment } from "./_commentServer";
import { DeletePostButton } from "./_delete-post-button";
import { getCommentsForPost, getPost, getUser } from "@/lib/data";
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
      <NewComment parentRkey={post.rkey} />
      <div className="grid gap-6">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            rkey={comment.rkey}
            author={comment.authorDid}
            createdAt={comment.createdAt}
            id={comment.rkey}
            comment={comment.body}
          />
        ))}
      </div>
    </main>
  );
}
