import { z } from "zod";
import { getBlog } from "../blog-data";

interface Props {
  params: { id: string };
}

export default async function BlogPost({ params: { id } }: Props) {
  const blog = await getBlog(id);

  return (
    <>
      <h1>{blog.value.title}</h1>
      <p>{blog.value.content}</p>
    </>
  );
}
