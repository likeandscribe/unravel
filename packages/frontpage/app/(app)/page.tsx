import { Button } from "@/lib/components/ui/button";
import Link from "next/link";
import { ChevronUpIcon } from "@radix-ui/react-icons";

export default function Home() {
  return (
    <div className="space-y-6">
      <Post {...tempPosts["1" as keyof typeof tempPosts]} />
      <Post {...tempPosts["2" as keyof typeof tempPosts]} />
      <Post {...tempPosts["3" as keyof typeof tempPosts]} />
      <Post {...tempPosts["4" as keyof typeof tempPosts]} />
    </div>
  );
}

const tempPosts = {
  "1": {
    id: "1",
    title: "Introducing the new Tailwind CSS v3.0",
    url: "https://tailwindcss.com",
    votes: 42,
    author: "@john.example.com",
    createdAt: new Date("2024-06-11T07:10:44.335Z"),
    commentCount: 4,
  },
  "2": {
    id: "1",
    title: "React 18 is here! What's new?",
    url: "https://reactjs.org",
    votes: 27,
    author: "@jane.example.com",
    createdAt: new Date("2024-06-11T04:10:44.335Z"),
    commentCount: 0,
  },
  "3": {
    id: "1",
    title: "The future of web development with WebAssembly",
    url: "https://webassembly.org",
    votes: 19,
    author: "@alex.example.com",
    createdAt: new Date("2024-06-10T07:10:44.335Z"),
    commentCount: 23,
  },
  "4": {
    id: "1",
    title: "The rise of no-code and low-code platforms",
    url: "https://nocode.com",
    votes: 12,
    author: "@sarah.example.com",
    createdAt: new Date("2024-06-08T07:10:44.335Z"),
    commentCount: 0,
  },
};

type PostProps = {
  id: string;
  title: string;
  url: string;
  votes: number;
  author: string;
  createdAt: Date;
  commentCount: number;
};

function PostInnerInteractive({ children }: { children: React.ReactNode }) {
  return <div className="relative z-10">{children}</div>;
}

function Post({
  id,
  title,
  url,
  votes,
  author,
  createdAt,
  commentCount,
}: PostProps) {
  const postHref = `/item/${id}`;
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
        <h2 className="text-lg font-medium">
          <a href={url} className="hover:underline">
            {title}
          </a>
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span>{new URL(url).host}</span>
          <span aria-hidden>•</span>
          <span>by {author}</span>
          <span aria-hidden>•</span>
          <span>{createdAt.toISOString()}</span>
          <span aria-hidden>•</span>
          <Link href={postHref} className="hover:underline">
            {commentCount} comments
          </Link>
        </div>
      </div>
    </article>
  );
}
