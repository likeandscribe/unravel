import { z } from "zod";

// Schemas
const Blog = z.object({
  value: z.object({
    content: z.string(),
    title: z.string(),
    createdAt: z.coerce.date(),
  }),
  cid: z.string(),
});

const BlogArray = z.object({
  records: z.array(Blog),
});

// Functions
const serviceUri = "https://hydnum.us-west.host.bsky.network/xrpc";
const repo = "did:plc:klmr76mpewpv7rtm3xgpzd7x";
const collection = "com.whtwnd.blog.entry";

export async function listBlogs() {
  const queryParams = new URLSearchParams({
    repo: repo,
    collection: collection,
  });

  const blogList = await fetch(
    `${serviceUri}/com.atproto.repo.listRecords?${queryParams}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return BlogArray.parse(await blogList.json());
}

export async function getBlog(rkey: string) {
  const queryParams = new URLSearchParams({
    repo: repo,
    collection: collection,
    rkey: rkey,
  });

  const blog = await fetch(
    `${serviceUri}/com.atproto.repo.getRecord?${queryParams}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return Blog.parse(await blog.json());
}
