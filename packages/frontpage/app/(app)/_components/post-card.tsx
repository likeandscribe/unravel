import { Button } from "@/lib/components/ui/button";
import { formatDistance } from "date-fns";
import { ChevronUpIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { getPlcDoc } from "@/lib/data";

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
  return (
    // TODO: Make article route to postHref via onClick on card except innser links or buttons
    <article className="relative flex items-center gap-4 bg-white dark:bg-gray-950 rounded-lg shadow-sm p-4">
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100 dark:hover:bg-gray-800 z-10 relative"
        >
          <ChevronUpIcon className="w-5 h-5" />
        </Button>
        <span className="font-medium">{votes}</span>
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
          <span>{formatDistance(createdAt, new Date())} ago</span>
          <span aria-hidden>•</span>
          <Link href={postHref} className="hover:underline">
            {commentCount} comments
          </Link>
        </div>
      </div>
    </article>
  );
}
