"use server";

import { getFrontpagePosts } from "@/lib/data/db/post";
import { PostCard } from "./_components/post-card";

export async function getMorePostsAction(input: { nextCursor: number }) {
  const { posts, nextCursor } = await getFrontpagePosts(input.nextCursor);

  return {
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
  };
}
