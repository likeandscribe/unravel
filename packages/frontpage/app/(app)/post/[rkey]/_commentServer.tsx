import { getPlcDoc, getUser } from "@/lib/data/user";
import { CommentClient, CommentProps } from "./_comment";
import { getCommentsForPost } from "@/lib/data/db/comment";

type ServerCommentProps = Omit<
  CommentProps,
  "voteAction" | "unvoteAction" | "initialVoteState" | "hasAuthored"
> & {
  cid: string;
  isUpvoted: boolean;
  childComments: Awaited<ReturnType<typeof getCommentsForPost>>;
};

export async function Comment({
  author,
  isUpvoted,
  childComments,
  ...props
}: ServerCommentProps) {
  const plc = await getPlcDoc(author);
  const handle = plc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  const user = await getUser();
  const hasAuthored = user?.did === author;

  return (
    <>
      <CommentClient
        {...props}
        author={handle ?? ""}
        hasAuthored={hasAuthored}
        initialVoteState={
          (await getUser())?.did === author
            ? "authored"
            : isUpvoted
              ? "voted"
              : "unvoted"
        }
      />
      {childComments?.map((comment) => (
        <Comment
          key={comment.id}
          id={comment.id}
          cid={comment.cid}
          rkey={comment.rkey}
          postRkey={props.postRkey}
          author={comment.authorDid}
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
