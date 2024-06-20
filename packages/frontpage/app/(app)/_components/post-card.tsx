import Link from "next/link";
import { createVote, deleteVote } from "@/lib/data/atproto/vote";
import { getVoteForPost } from "@/lib/data/db/vote";
import { getPlcDoc, ensureUser, getUser } from "@/lib/data/user";
import { TimeAgo } from "@/lib/components/time-ago";
import { VoteButton } from "./vote-button";

type PostProps = {
  id: number;
  title: string;
  url: string;
  votes: number;
  author: string;
  createdAt: Date;
  commentCount: number;
  rkey: string;
  cid: string;
  isUpvoted: boolean;
};

export async function PostCard({
  id,
  title,
  url,
  votes,
  author,
  createdAt,
  commentCount,
  rkey,
  cid,
  isUpvoted,
}: PostProps) {
  const postHref = `/post/${rkey}`;
  const plc = await getPlcDoc(author);
  const handle = plc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  return (
    // TODO: Make article route to postHref via onClick on card except innser links or buttons
    <article className="flex items-center gap-4 shadow-sm rounded-lg p-4">
      <div className="flex flex-col items-center">
        <VoteButton
          voteAction={async () => {
            "use server";
            await ensureUser();
            await createVote({
              subjectCid: cid,
              subjectRkey: rkey,
              subjectCollection: "fyi.unravel.frontpage.post",
            });
          }}
          unvoteAction={async () => {
            "use server";
            await ensureUser();
            const vote = await getVoteForPost(id);
            if (!vote) {
              // TODO: Show error notification
              console.error("Vote not found for post", id);
              return;
            }
            await deleteVote(vote.rkey);
          }}
          initialState={
            (await getUser())?.did === author
              ? "authored"
              : isUpvoted
                ? "voted"
                : "unvoted"
          }
          votes={votes}
        />
      </div>
      <div className="w-full">
        <h2 className="mb-1 text-xl">
          <a
            href={url}
            className="hover:underline flex flex-wrap items-center gap-x-2"
          >
            {title}{" "}
            <span className="text-gray-500 dark:text-gray-400 font-normal text-sm md:text-base">
              ({new URL(url).host})
            </span>
          </a>
        </h2>
        <div className="flex flex-wrap text-gray-500 dark:text-gray-400 sm:gap-4">
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <div className="flex gap-2">
              <span aria-hidden>•</span>
              <span>by {handle}</span>
            </div>
          </div>
          <div className="w-full flex items-center justify-between gap-2 md:gap-4 sm:w-auto">
            <div className="flex gap-2">
              <span aria-hidden>•</span>
              <TimeAgo createdAt={createdAt} side="bottom" />
            </div>
            <div className="flex gap-2">
              <span aria-hidden>•</span>
              <Link href={postHref} className="hover:underline">
                {commentCount} comments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
