import { getCommentsForPost } from "@/lib/data/db/comment";
import { getUser } from "@/lib/data/user";
import { notFound } from "next/navigation";
import { PostCard } from "../../_components/post-card";
import { DeletePostButton } from "./_delete-post-button";
import { getPost } from "@/lib/data/db/post";

type Params = {
  postRkey: string;
};

export default async function Post({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  getUser(); // Prefetch user
  const post = await getPost(params.postRkey);
  if (!post) {
    notFound();
  }
  const user = await getUser();

  const isPostAuthor = user?.did === post.authorDid
  const postIsLive = post.status === "live";
  const showDeleteButton = isPostAuthor && postIsLive;

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
        {showDeleteButton && (
          <div className="flex justify-end">
            <DeletePostButton rkey={post.rkey} />
          </div>
        )}
        {children}
      </main>
    </>
  );
}
