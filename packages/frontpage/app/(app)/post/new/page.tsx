import { NewPostForm } from "./_client";

export default function NewPost() {
  return (
    <main className="flex flex-col gap-3">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        New post
      </h2>
      <NewPostForm />
    </main>
  );
}
