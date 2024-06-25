import { getUser, getVerifiedHandle } from "@/lib/data/user";
import { CommentClientWrapperWithToolbar, CommentProps } from "./_comment";
import { getCommentsForPost } from "@/lib/data/db/comment";
import { cva } from "class-variance-authority";
import { TimeAgo } from "@/lib/components/time-ago";
import { UserAvatar } from "@/lib/components/avatar";
import Link from "next/link";

const commentVariants = cva(undefined, {
  variants: {
    level: {
      0: "",
      1: "pl-8",
      2: "pl-16",
      3: "pl-24",
    },
  },
  defaultVariants: {
    level: 0,
  },
});

type ServerCommentProps = Omit<
  CommentProps,
  | "voteAction"
  | "unvoteAction"
  | "initialVoteState"
  | "hasAuthored"
  | "children"
> & {
  cid: string;
  isUpvoted: boolean;
  childComments: Awaited<ReturnType<typeof getCommentsForPost>>;
  comment: string;
  createdAt: Date;
};

export async function Comment({
  authorDid,
  isUpvoted,
  childComments,
  comment,
  createdAt,
  ...props
}: ServerCommentProps) {
  const handle = await getVerifiedHandle(authorDid);

  const user = await getUser();
  const hasAuthored = user?.did === authorDid;

  return (
    <>
      <CommentClientWrapperWithToolbar
        {...props}
        hasAuthored={hasAuthored}
        authorDid={authorDid}
        initialVoteState={
          (await getUser())?.did === authorDid
            ? "authored"
            : isUpvoted
              ? "voted"
              : "unvoted"
        }
      >
        <div className="flex items-center gap-2">
          <UserAvatar did={authorDid} />
          <div className="font-medium">{handle}</div>
          <Link
            href={`/post/${props.postRkey}/${props.rkey}`}
            className="text-gray-500 text-xs dark:text-gray-400"
          >
            <TimeAgo createdAt={createdAt} side="bottom" />
          </Link>
        </div>
        <div className="prose prose-stone">
          <p>{comment}</p>
        </div>
      </CommentClientWrapperWithToolbar>

      {childComments?.map((comment) => (
        <Comment
          key={comment.id}
          id={comment.id}
          cid={comment.cid}
          rkey={comment.rkey}
          postRkey={props.postRkey}
          authorDid={comment.authorDid}
          comment={comment.body}
          createdAt={comment.createdAt}
          childComments={comment.children}
          isUpvoted={comment.userHasVoted}
          // TODO: Show deeper levels behind a parent permalink. For now we just show them all at the max level
          level={Math.min((props.level ?? 0) + 1, 3) as CommentProps["level"]}
        />
      ))}
    </>
  );
}
