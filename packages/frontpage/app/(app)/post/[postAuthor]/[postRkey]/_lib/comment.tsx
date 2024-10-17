import { getUser } from "@/lib/data/user";
import {
  CommentClientWrapperWithToolbar,
  CommentLevel,
  NestComment,
} from "./comment-client";
import { CommentModel } from "@/lib/data/db/comment";
import { TimeAgo } from "@/lib/components/time-ago";
import { AvatarFallback, UserAvatar } from "@/lib/components/user-avatar";
import Link from "next/link";
import {
  getDidFromHandleOrDid,
  getVerifiedHandle,
} from "@/lib/data/atproto/identity";
import { UserHoverCard } from "@/lib/components/user-hover-card";

type CommentProps = {
  comment: CommentModel;
  postAuthorParam: string;
  postRkey: string;
  level?: CommentLevel;
};

export function Comment({ comment, level, ...props }: CommentProps) {
  if (
    comment.status !== "live" &&
    comment.children &&
    comment.children.length === 0
  ) {
    return null;
  }

  if (comment.status === "live") {
    return <LiveComment {...props} level={level} comment={comment} />;
  }

  return <DeletedComment {...props} level={level} comment={comment} />;
}

async function LiveComment({
  comment,
  level,
  postAuthorParam,
  postRkey,
}: CommentProps) {
  const [postAuthorDid, handle] = await Promise.all([
    getDidFromHandleOrDid(postAuthorParam),
    getVerifiedHandle(comment.authorDid),
  ]);

  if (!postAuthorDid) {
    // This should never happen because we resolve this in the post page
    throw new Error("Post author not found");
  }

  const user = await getUser();
  const hasAuthored = user?.did === comment.authorDid;

  const childCommentLevel = getChildCommentLevel(level);
  const commentHref = `/post/${postAuthorParam}/${postRkey}/${handle}/${comment.rkey}`;

  return (
    <>
      <CommentClientWrapperWithToolbar
        commentHref={commentHref}
        level={level}
        postRkey={postRkey}
        postAuthorDid={postAuthorDid}
        hasAuthored={hasAuthored}
        rkey={comment.rkey}
        cid={comment.cid}
        id={comment.id}
        authorDid={comment.authorDid}
        initialVoteState={
          hasAuthored ? "authored" : comment.userHasVoted ? "voted" : "unvoted"
        }
      >
        <div className="flex items-center gap-2">
          <UserHoverCard asChild did={comment.authorDid}>
            <Link
              href={`/profile/${handle}`}
              className="flex items-center gap-2"
            >
              <UserAvatar did={comment.authorDid} />
              <div className="font-medium">@{handle}</div>
            </Link>
          </UserHoverCard>
          <Link
            href={commentHref}
            className="text-gray-500 text-xs dark:text-gray-400 hover:underline"
          >
            <TimeAgo createdAt={comment.createdAt} side="bottom" />
          </Link>
        </div>
        <p className="whitespace-pre-wrap text-ellipsis overflow-x-hidden">
          {comment.body}
        </p>
      </CommentClientWrapperWithToolbar>

      {comment.children?.map((comment) => (
        <Comment
          key={comment.id}
          level={childCommentLevel}
          comment={comment}
          postAuthorParam={postAuthorParam}
          postRkey={postRkey}
        />
      ))}
    </>
  );
}

function DeletedComment({
  comment,
  postAuthorParam,
  postRkey,
  level,
}: CommentProps) {
  const childCommentLevel = getChildCommentLevel(level);

  return (
    <NestComment level={level} className="flex flex-col gap-2 flex-1 p-1">
      <div className="flex flex-col gap-2 opacity-60">
        <div className="flex items-center gap-2">
          <AvatarFallback size="small" />
          <div className="font-medium" aria-hidden>
            @deleted
          </div>
          <div className="text-gray-500 text-xs dark:text-gray-400">
            <TimeAgo createdAt={comment.createdAt} side="bottom" />
          </div>
        </div>
        <p>Deleted comment</p>
      </div>
      {comment.children?.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          postRkey={postRkey}
          postAuthorParam={postAuthorParam}
          level={childCommentLevel}
        />
      ))}
    </NestComment>
  );
}

function getChildCommentLevel(level: number | null | undefined) {
  // TODO: Show deeper levels behind a parent permalink. For now we just show them all at the max level
  return Math.min((level ?? 0) + 1, 3) as CommentProps["level"];
}
