import { ReactNode } from "react";

export default function Home() {
  const posts = (
    <>
      <Post
        title="Is a burrito a monad?"
        snippet="As we all know, a monad is just a monoid in the category of endofunctors. This is intuitive to you and I, but what if you need to explain what a monad is in more practical terms. Well that's where the three laws of monads come in."
      />
      <Post
        title="Serverless XState"
        snippet="AWS Step functions are cool and allow you to build state machines, but they are difficult to setup for processes that are meant to wait for some external signal like a request from a user."
      />
    </>
  );
  return (
    <Feed>
      <PostGroup author="bg-yellow-500">{posts}</PostGroup>
      <PostGroup author="bg-blue-500">{posts}</PostGroup>
      <PostGroup author="bg-green-500">{posts}</PostGroup>
      <PostGroup author="bg-purple-500">{posts}</PostGroup>
      <PostGroup author="bg-red-500">{posts}</PostGroup>
    </Feed>
  );
}

function Feed({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-8 p-4">{children}</section>;
}

function Post({ title, snippet }: { title: string; snippet: string }) {
  return (
    <article className="p-4 border-l-2">
      <h2 className="text-2xl">{title}</h2>
      <p>{snippet}</p>
    </article>
  );
}

function PostGroup({
  children,
  author,
}: {
  children: ReactNode;
  author: string;
}) {
  return (
    <section className="flex gap-1 flex-1">
      <div>
        <div className="sticky top-2">
          <Avatar author={author} />
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Avatar({ author }: { author: string }) {
  return <div className={`w-8 h-8 ${author} rounded-sm`} />;
}
