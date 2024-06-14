import { getFrontpagePosts } from "@/lib/data";
import { PostCard } from "./_components/post-card";

export default async function Home() {
  const posts = await getFrontpagePosts();
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          author={post.authorDid}
          createdAt={post.createdAt}
          id={post.rkey}
          title={post.title}
          url={post.url}
          votes={post.voteCount}
          commentCount={post.commentCount}
        />
      ))}
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
    createdAt: new Date("2024-06-13T15:10:44.335Z"),
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
