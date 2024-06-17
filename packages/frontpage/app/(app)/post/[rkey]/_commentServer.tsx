import {
  createVote,
  deleteVote,
  ensureUser,
  getPlcDoc,
  getUser,
  getVoteForComment,
} from "@/lib/data";
import { CommentClient, CommentProps } from "./_comment";

export async function Comment({
  author,
  id,
  isUpvoted,
  ...props
}: Omit<CommentProps, "voteAction" | "unvoteAction" | "initialVoteState"> & {
  id: number;
  cid: string;
  isUpvoted: boolean;
}) {
  const plc = await getPlcDoc(author);
  const handle = plc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  return (
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
  );
}
