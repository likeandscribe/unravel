import { Button } from "@/lib/components/ui/button";
import { ChevronUpIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { getPlcDoc, getUser } from "@/lib/data";
import { TimeAgo } from "@/lib/components/time-ago";

type PostProps = {
  id: string;
  title: string;
  url: string;
  votes: number;
  author: string;
  createdAt: Date;
  commentCount: number;
};

export async function PostCard({
  id,
  title,
  url,
  votes,
  author,
  createdAt,
  commentCount,
}: PostProps) {
  const postHref = `/post/${id}`;
  const plc = await getPlcDoc(author);
  const handle = plc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  const isAuthoredByCurrentUser = (await getUser())?.did === author;

  return (
    // TODO: Make article route to postHref via onClick on card except innser links or buttons
    <article className="flex items-center gap-4 shadow-sm rounded-lg p-4">
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100 dark:hover:bg-gray-800 z-10 relative"
          disabled={isAuthoredByCurrentUser}
        >
          <ChevronUpIcon className="w-5 h-5" />
        </Button>
        <span className="font-medium">{votes}</span>
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
