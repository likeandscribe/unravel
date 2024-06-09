import { z } from "zod";
import { getBlog } from "../blog-data";

interface Props {
  params: { rkey: string };
}

export default async function BlogPost({ params: { rkey } }: Props) {
  const blog = await getBlog(rkey);

  return (
    <>
      <h1>{blog.value.title}</h1>
      <p>{blog.value.content}</p>
    </>
  );
}
