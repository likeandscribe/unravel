import Link from "next/link";
import { listBlogs } from "./blog-data";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export default async function Blog() {
  const blogList = await listBlogs();
  return (
    <>
      <h1 className="text-4xl mb-8">Unravel Blog</h1>
      <ul className="flex flex-col space-y-6">
        {blogList.records.map((blog) => (
          <li key={blog.cid}>
            <Link href={`/blog/${blog.uri.rkey}`}>
              <article className="shadow-sm rounded-lg p-4 bg-white dark:bg-slate-900">
                <h2 className="text-xl">{blog.value.title}</h2>
                <p>{dateFormatter.format(blog.value.createdAt)}</p>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
