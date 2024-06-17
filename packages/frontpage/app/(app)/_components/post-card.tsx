import Link from "next/link";
import {
  getPlcDoc,
  getUser,
  createVote,
  deleteVote,
  getVoteForPost,
  ensureUser,
} from "@/lib/data";
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
    <article className="relative flex items-center gap-4 bg-white dark:bg-gray-950 rounded-lg shadow-sm p-4">
      <div className="flex flex-col items-center gap-2">
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
            // const vote = await getVoteForPost(id)
            // await deleteVote(vote.rkey)
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
      <div className="flex-1">
        <h2 className="text-xl font-medium mb-1">
          <a href={url} className="hover:underline">
            {title}
          </a>
        </h2>
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span>{new URL(url).host}</span>
          <span aria-hidden>•</span>
          <span>by {handle}</span>
          <span aria-hidden>•</span>
          <TimeAgo createdAt={createdAt} side="bottom" />
          <span aria-hidden>•</span>
          <Link href={postHref} className="hover:underline">
            {commentCount} comments
          </Link>
        </div>
      </div>
    </article>
  );
}
