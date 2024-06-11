import { Button } from "@/lib/components/ui/button";
import { Textarea } from "@/lib/components/ui/textarea";
import { ChevronUpIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { VariantProps, cva } from "class-variance-authority";
import { PostCard } from "../../_components/post-card";

export default function Item() {
  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <PostCard
        {...{
          id: "1",
          title: "React 18 is here! What's new?",
          url: "https://react.dev",
          votes: 23,
          author: "@tim.example.com",
          createdAt: new Date("2024-06-11T07:10:44.335Z"),
          commentCount: 4,
        }}
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Textarea
            placeholder="Write a comment..."
            className="resize-none rounded-2xl border border-gray-200 p-3 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-800 dark:bg-gray-950 dark:focus:border-primary"
          />
        </div>
        <Button className="flex flex-row gap-2">
          <ChatBubbleIcon className="w-4 h-4" /> Post
        </Button>
      </div>
      <div className="grid gap-6">
        <Comment
          id="1"
          author="@john.example.com"
          comment="This is a really interesting article! I learned a lot about the history of link aggregation services. Can't wait to see what the comments have to say."
          createdAt={new Date("2024-06-11T08:10:44.335Z")}
        />
        <Comment
          id="2"
          level={1}
          author="@jane.example.com"
          comment="I agree, this is a really well-written article. The author did a great job of explaining the evolution of link aggregation services and the challenges they face."
          createdAt={new Date("2024-06-11T08:10:44.335Z")}
        />
        <Comment
          id="2"
          level={1}
          author="@tim.example.com"
          comment="I'm really excited to see how this service evolves. The ability to curate and discover new content is so valuable in today's information-rich world."
          createdAt={new Date("2024-06-11T08:10:44.335Z")}
        />
      </div>
    </main>
  );
}

const commentVariants = cva("flex items-start gap-4", {
  variants: {
    level: {
      0: "",
      1: "pl-14",
    },
  },
  defaultVariants: {
    level: 0,
  },
});

type CommentProps = VariantProps<typeof commentVariants> & {
  id: string;
  author: string;
  comment: string;
  createdAt: Date;
};

function Comment({ id, author, comment, level, createdAt }: CommentProps) {
  return (
    <article className={commentVariants({ level })}>
      <div className="grid gap-2 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium">{author}</div>
          <div className="text-gray-500 text-xs dark:text-gray-400">
            {createdAt.toISOString()}
          </div>
        </div>
        <div className="prose prose-stone">
          <p>{comment}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ChevronUpIcon className="w-4 h-4" />
            <span className="sr-only">Vote</span>
          </Button>
          <Button variant="ghost" size="icon">
            <ChatBubbleIcon className="w-4 h-4" />
            <span className="sr-only">Reply</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
