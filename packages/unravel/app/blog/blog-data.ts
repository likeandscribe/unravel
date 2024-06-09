import { AtpBaseClient } from "@atproto/api";
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

const BlogArray = z.array(Blog);

// Functions
const serviceUri = "https://hydnum.us-west.host.bsky.network";
const baseClient = new AtpBaseClient().service(serviceUri);

const atprotoRepo = baseClient.com.atproto.repo;
const repo = "did:plc:klmr76mpewpv7rtm3xgpzd7x";
const collection = "com.whtwnd.blog.entry";

export async function listBlogs() {
  const records = await atprotoRepo.listRecords({
    repo: repo,
    collection: collection,
  });

  return BlogArray.parse(records.data.records);
}

export async function getBlog(id: string) {
  const blog = await atprotoRepo.getRecord({
    repo: repo,
    collection: collection,
    rkey: id,
  });

  return Blog.parse(blog.data);
}
