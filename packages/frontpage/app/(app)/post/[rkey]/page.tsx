import { PostCard } from "../../_components/post-card";
import { NewComment, Comment } from "./_comment";
import { DeletePostButton } from "./_delete-post-button";
import { getPost, getUser } from "@/lib/data";
import { notFound } from "next/navigation";

type Params = {
  rkey: string;
};

export default async function Item({ params }: { params: Params }) {
  const post = await getPost(params.rkey);
  getUser(); // Prefetch user
  if (!post) {
    notFound();
  }
  const user = await getUser();
  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <PostCard
        author={post.authorDid}
        createdAt={post.createdAt}
        id={post.rkey}
        commentCount={post.commentCount}
        title={post.title}
        url={post.url}
        votes={post.voteCount}
      />
      {user?.did === post.authorDid && (
        <div className="flex justify-end">
          <DeletePostButton rkey={params.rkey} />
        </div>
      )}
      <NewComment />
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
