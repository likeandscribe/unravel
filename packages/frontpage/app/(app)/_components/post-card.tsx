import Link from "next/link";
import { createVote, deleteVote } from "@/lib/data/atproto/vote";
import { getVoteForPost } from "@/lib/data/db/vote";
import { ensureUser, getUser } from "@/lib/data/user";
import { TimeAgo } from "@/lib/components/time-ago";
import { VoteButton } from "./vote-button";
import { PostCollection, deletePost } from "@/lib/data/atproto/post";
import { getVerifiedHandle } from "@/lib/data/atproto/identity";
import { UserHoverCard } from "@/lib/components/user-hover-card";
import type { DID } from "@/lib/data/atproto/did";
import { createReport } from "@/lib/data/db/report";
import { EllipsisDropdown } from "./ellipsis-dropdown";
import { ReportReason } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { ReportButton } from "./report-button";
import { DeleteButton } from "./delete-button";

type PostProps = {
  id: number;
  title: string;
  url: string;
  votes: number;
  author: DID;
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
  const handle = await getVerifiedHandle(author);
  const postHref = `/post/${handle}/${rkey}`;
  const user = await getUser();

  return (
    // TODO: Make article route to postHref via onClick on card except innser links or buttons
    <article className="flex items-center gap-4 shadow-sm rounded-lg p-4 bg-white dark:bg-slate-900">
      <div className="flex flex-col items-center">
        <VoteButton
          voteAction={async () => {
            "use server";
            await ensureUser();
            await createVote({
              subjectAuthorDid: author,
              subjectCid: cid,
              subjectRkey: rkey,
              subjectCollection: PostCollection,
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
            <div className="flex gap-2 items-center">
              <span aria-hidden>•</span>
              <UserHoverCard did={author} asChild>
                <Link href={`/profile/${handle}`} className="hover:underline">
                  by {handle}
                </Link>
              </UserHoverCard>
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

          {user ? (
            <div className="ml-auto">
              <EllipsisDropdown>
                <ReportButton
                  reportAction={ReportPostAction.bind(null, {
                    rkey,
                    cid,
                    author,
                  })}
                />
                {user?.did === author ? (
                  <DeleteButton
                    deleteAction={DeletePostAction.bind(null, rkey)}
                  />
                ) : null}
              </EllipsisDropdown>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export async function DeletePostAction(rkey: string) {
  "use server";
  await ensureUser();
  await deletePost(rkey);

  revalidatePath("/");
}

export async function ReportPostAction(
  input: {
    rkey: string;
    cid: string;
    author: DID;
  },
  formData: FormData,
) {
  "use server";
  const user = await ensureUser();

  const creatorComment = formData.get("creatorComment") as string;
  const reportReason = formData.get("reportReason") as ReportReason;

  if (
    typeof creatorComment !== "string" ||
    !reportReason ||
    creatorComment.length >= 250
  ) {
    throw new Error("Missing creatorComment or reportReason");
  }
  await createReport({
    subjectUri: `at://${input.author}/${PostCollection}/${input.rkey}`,
    subjectDid: input.author,
    subjectCollection: PostCollection,
    subjectRkey: input.rkey,
    subjectCid: input.cid,
    createdBy: user.did,
    createdAt: new Date(),
    creatorComment,
    reportReason,
    status: "pending",
  });
  revalidatePath("/");
}
