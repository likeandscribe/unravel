import { getUser } from "@/lib/data/user";
import { notFound } from "next/navigation";
import { PostCard } from "../../../_components/post-card";
import { getPost } from "@/lib/data/db/post";
import { getDidFromHandleOrDid } from "@/lib/data/atproto/identity";

type Params = {
  postRkey: string;
  postAuthor: string;
};

export default async function Post({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  void getUser(); // Prefetch user
  const didParam = await getDidFromHandleOrDid(params.postAuthor);
  if (!didParam) {
    notFound();
  }
  const post = await getPost(didParam, params.postRkey);
  if (!post) {
    notFound();
  }

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
      {children}
    </main>
  );
}
