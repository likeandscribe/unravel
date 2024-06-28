import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { NewComment } from "./_lib/comment-client";
import { Comment } from "./_lib/comment";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { Metadata } from "next";
import { getVerifiedHandle } from "@/lib/data/user";
import { PostPageParams, getPostPageData } from "./_lib/page-data";

export async function generateMetadata({
  params,
}: {
  params: PostPageParams;
}): Promise<Metadata> {
  const { post } = await getPostPageData(params);

  const handle = await getVerifiedHandle(post.authorDid);
  const path = `/post/${params.postAuthor}/${params.postRkey}`;

  return {
    title: post.title,
    alternates: {
      canonical: `https://frontpage.fyi${path}`,
    },
    openGraph: {
      title: post.title,
      description: "Discuss this post on Frontpage.",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [`@${handle}`],
      url: `https://frontpage.fyi${path}`,
      images: [
        {
          url: `${path}/og-image`,
        },
      ],
    },
  };
}

export default async function Post({ params }: { params: PostPageParams }) {
  const { post, authorDid } = await getPostPageData(params);
  const comments = await getCommentsForPost(post.id);

  return (
    <>
      {post.status === "live" ? (
        <NewComment postRkey={post.rkey} postAuthorDid={authorDid} />
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
