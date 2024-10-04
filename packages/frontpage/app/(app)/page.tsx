import { getFrontpagePosts } from "@/lib/data/db/post";
import { PostCard } from "./_components/post-card";
import { unstable_noStore } from "next/cache";

export default async function Home() {
  unstable_noStore();
  const posts = await getFrontpagePosts();
  return (
    <div className="space-y-6">
      <form
        action={async () => {
          "use server";
          throw new Error("Server error");
        }}
      >
        <button type="submit">Server error</button>
      </form>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          author={post.authorDid}
          createdAt={post.createdAt}
          id={post.id}
          title={post.title}
          url={post.url}
          votes={post.voteCount}
          commentCount={post.commentCount}
          cid={post.cid}
          rkey={post.rkey}
          isUpvoted={post.userHasVoted}
        />
      ))}
    </div>
  );
}
