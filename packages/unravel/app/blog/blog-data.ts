import { z } from "zod";
import { AtpAgent } from "@atproto/api";
const agent = new AtpAgent({
  service: "https://hydnum.us-west.host.bsky.network",
});

const Blog = z.object({
  value: z.object({
    content: z.string(),
    title: z.string(),
    createdAt: z.coerce.date(),
  }),
  cid: z.string(),
});

const BlogArray = z.array(Blog);

export async function listRecords() {
  const records = await agent.com.atproto.repo.listRecords({
    repo: "did:plc:klmr76mpewpv7rtm3xgpzd7x",
    collection: "com.whtwnd.blog.entry",
  });

  return BlogArray.parse(records.data.records);
}
