import { z } from "zod";

interface Props {
  params: { id: string };
}

async function getBlog(id: string) {
  const params = new URLSearchParams({
    repo: "did:plc:klmr76mpewpv7rtm3xgpzd7x",
    collection: "com.whtwnd.blog.entry",
    rkey: id,
  });
  const res = await fetch(
    `https://hydnum.us-west.host.bsky.network/xrpc/com.atproto.repo.getRecord?${params}`,
  );

  return Blog.parse(await res.json());
}
export default async function BlogPost({ params: { id } }: Props) {
  const blog = await getBlog(id);
  console.log(JSON.stringify(blog));
  return <h1>{blog.value.content}</h1>;
}
