import { Comment } from "../../_lib/comment";
import Link from "next/link";
import { Metadata } from "next";
import { getVerifiedHandle } from "@/lib/data/user";
import { CommentPageParams, getCommentPageData } from "./_lib/page-data";

function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

export async function generateMetadata({
  params,
}: {
  params: CommentPageParams;
}): Promise<Metadata> {
  const { comment, post } = await getCommentPageData(params);

  const handle = await getVerifiedHandle(comment.authorDid);
  const path = `/post/${params.postAuthor}/${params.postRkey}/${params.commentAuthor}/${params.commentRkey}`;

  return {
    title: `${post.title} - ${comment.status === "live" ? `@${handle}: "${truncateText(comment.body, 15)}..."` : "Deleted comment"}`,
    alternates: {
      canonical: `https://frontpage.fyi${path}`,
    },
    openGraph:
      comment.status === "live"
        ? {
            title: `@${handle}'s comment on Frontpage`,
            description: truncateText(comment.body, 47),
            type: "article",
            publishedTime: comment.createdAt.toISOString(),
            authors: [`@${handle}`],
            url: `https://frontpage.fyi${path}`,
            images: [
              {
                url: `${path}/og-image`,
              },
            ],
          }
        : undefined,
  };
}

export default async function CommentPage({
  params,
}: {
  params: CommentPageParams;
}) {
  const { comment, post } = await getCommentPageData(params);

  return (
    <>
      <div className="flex justify-end">
        <Link
          href={`/post/${params.postAuthor}/${params.postRkey}`}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          See all comments
        </Link>
      </div>
      <Comment
        comment={comment}
        postAuthorParam={params.postAuthor}
        postRkey={post.rkey}
      />
    </>
  );
}
