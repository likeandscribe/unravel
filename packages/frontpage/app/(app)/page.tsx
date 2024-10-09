import { unstable_noStore } from "next/cache";
import { PostList } from "./_components/post-list";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { PostCard } from "./_components/post-card";
import { getFrontpagePosts } from "@/lib/data/db/post";

export default async function Home() {
  unstable_noStore();
  const { posts, nextCursor } = await getFrontpagePosts(10, 0);

  return (
    <div className="space-y-6">
      <SWRConfig
        value={{
          fallback: {
            [unstable_serialize(() => ["posts", 0])]: [
              {
                postCards: posts.map((post) => (
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
                )),
                nextCursor: nextCursor,
              },
            ],
          },
        }}
      >
        <PostList />
      </SWRConfig>
    </div>
  );
}
