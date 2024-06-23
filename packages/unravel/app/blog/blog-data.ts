import { z } from "zod";

// TODO: Extract into shared lib (it currently also exists in frontpage)
const AtUri = z.string().transform((value, ctx) => {
  const match = value.match(/^at:\/\/(.+?)(\/.+?)?(\/.+?)?$/);
  if (!match) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid AT URI: ${value}`,
    });
    return z.NEVER;
  }

  const [, authority, collection, rkey] = match;
  if (!authority || !collection || !rkey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Undefined or empty AT URI parts: ${value}`,
    });
    return z.NEVER;
  }

  return {
    authority,
    collection: collection.replace("/", ""),
    rkey: rkey.replace("/", ""),
    value,
  };
});

const Blog = z.object({
  value: z.object({
    content: z.string(),
    title: z.string(),
    createdAt: z.coerce.date(),
  }),
  uri: AtUri,
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
