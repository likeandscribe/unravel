import { Suspense, cache } from "react";
import { PostCard } from "../../_components/post-card";
import { NewComment } from "./_comment";
import { Comment } from "./_commentServer";
import { DeletePostButton } from "./_delete-post-button";
import {
  PostRecord,
  ensureUser,
  getCommentsForPost,
  getPost,
  getPostFromUserPds,
  getUser,
  uncached_doesPostExist,
} from "@/lib/data";
import { notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { Spinner } from "@/lib/components/ui/spinner";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";

type Params = {
  rkey: string;
};

export default async function Item({ params }: { params: Params }) {
  const doesPostExist = await uncached_doesPostExist(params.rkey);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      {doesPostExist ? (
        <Post rkey={params.rkey} />
      ) : (
        <Suspense fallback={<OptimisticPost rkey={params.rkey} />}>
          <PollPost rkey={params.rkey} />
        </Suspense>
      )}
    </main>
  );
}

const MAX_POLLS = 5;
async function PollPost({ rkey }: { rkey: string }) {
  let exists = await uncached_doesPostExist(rkey);
  let polls = 0;
  while (!exists) {
    if (polls >= MAX_POLLS) {
      console.error(`Post not found after polling: ${rkey}`);
      return (
        <Alert variant="destructive">
          <AlertTitle>Post not found</AlertTitle>
          <AlertDescription>
            This shouldn&apos;t have happened. Please try again later and let us
            know at{" "}
            <a
              href="https://bsky.app/profile/unravel.fyi"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              @unravel.fyi <OpenInNewWindowIcon className="inline" />
            </a>
          </AlertDescription>
        </Alert>
      );
    }
    polls++;
    await new Promise((resolve) => setTimeout(resolve, 250));
    exists = await uncached_doesPostExist(rkey);
  }

  return <Post rkey={rkey} />;
}

async function Post({ rkey }: { rkey: string }) {
  const post = await getPost(rkey);
  if (!post) throw new Error("Post not found"); // We only render a post when it exists
  const user = await getUser();
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      <PostCard
        author={post.authorDid}
        createdAt={post.createdAt}
        id={post.rkey}
        commentCount={post.commentCount}
        title={post.title}
        url={post.url}
        votes={post.voteCount}
      />
      {user?.did === post.authorDid && (
        <div className="flex justify-end">
          <DeletePostButton rkey={rkey} />
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
    </>
  );
}

const getOptimisticPost = cache(async (rkey: string) => {
  let pdsPost;
  try {
    pdsPost = await getPostFromUserPds(rkey);
  } catch (e) {
    console.error(e);
    return null;
  }
  if (!pdsPost) return null;
  const postResult = PostRecord.safeParse(pdsPost);
  if (!postResult.success) {
    console.error(postResult.error);
    return null;
  }
  return postResult.data;
});

async function OptimisticPost({ rkey }: { rkey: string }) {
  const post = await getOptimisticPost(rkey);
  if (!post) return notFound();

  return (
    <>
      <PostCard
        author={(await ensureUser()).did}
        createdAt={new Date(post.createdAt)}
        id={rkey}
        commentCount={0}
        title={post.title}
        url={post.url}
        votes={1}
      />
      {/* Optimist posts always have a delete button because they're fetched from the logged in user's PDS */}
      <div className="flex justify-end">
        <DeletePostButton rkey={rkey} />
      </div>
      <Alert>
        <AlertTitle className="flex">
          <Spinner className="mr-2" />
          Pending
        </AlertTitle>
        <AlertDescription>
          This post is not yet confirmed by the network. It will be visible to
          others once it is confirmed.
        </AlertDescription>
      </Alert>
    </>
  );
}
