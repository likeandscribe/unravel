import { z } from "zod";
import { AtpAgent } from "@atproto/api";
const agent = new AtpAgent({
  service: "https://hydnum.us-west.host.bsky.network",
});

// Schemas
const Blog = z.object({
  value: z.object({
    content: z.string(),
    title: z.string(),
    createdAt: z.coerce.date(),
  }),
  cid: z.string(),
});

const BlogArray = z.array(Blog);

const repo = "did:plc:klmr76mpewpv7rtm3xgpzd7x";
const collection = "com.whtwnd.blog.entry";

// Functions
export async function listRecords() {
  const records = await agent.com.atproto.repo.listRecords({
    repo: repo,
    collection: collection,
  });

  return BlogArray.parse(records.data.records);
}

export async function getBlog(id: string) {
  const blog = await agent.com.atproto.repo.getRecord({
    repo: repo,
    collection: collection,
    rkey: id,
  });

  return Blog.parse(blog.data);
}
