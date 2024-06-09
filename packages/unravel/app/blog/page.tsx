import { listBlogs } from "./blog-data";

export default async function Blog() {
  const blogList = await listBlogs();
  return (
    <>
      <h1>Blog</h1>
      <ul>
        {blogList.records.map((blog) => (
          <li key={blog.cid}>{blog.value.content}</li>
        ))}
      </ul>
    </>
  );
}
