import { createVote, deleteVote } from "@/lib/data/atproto/vote";
import { getVoteForComment } from "@/lib/data/db/vote";
import { getPlcDoc, getUser, ensureUser } from "@/lib/data/user";
import { CommentClient, CommentProps } from "./_comment";
import { getCommentsForPost } from "@/lib/data/db/comment";

type ServerCommentProps = Omit<
  CommentProps,
  "voteAction" | "unvoteAction" | "initialVoteState"
> & {
  id: number;
  cid: string;
  isUpvoted: boolean;
  childComments: Awaited<ReturnType<typeof getCommentsForPost>>;
};

export async function Comment({
  author,
  id,
  isUpvoted,
  childComments,
  ...props
}: ServerCommentProps) {
  const plc = await getPlcDoc(author);
  const handle = plc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  return (
    <>
      <CommentClient
        {...props}
        author={handle ?? ""}
        initialVoteState={
          (await getUser())?.did === author
            ? "authored"
            : isUpvoted
              ? "voted"
              : "unvoted"
        }
        voteAction={async () => {
          "use server";
          await ensureUser();
          await createVote({
            subjectCid: props.cid,
            subjectRkey: props.rkey,
            subjectCollection: "fyi.unravel.frontpage.comment",
          });
        }}
        unvoteAction={async () => {
          "use server";
          await ensureUser();
          const vote = await getVoteForComment(id);
          if (!vote) {
            console.error("Vote not found for comment", id);
            return;
          }

          await deleteVote(vote.rkey);
        }}
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
          level={(props?.level ?? 0) + 1}
          deleteAction={async () => {
            "use server";
          }}
        />
      ))}
    </>
  );
}
