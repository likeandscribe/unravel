import slugify from "slugify";
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

  const list = BlogArray.parse(await blogList.json());

  return {
    records: list.records.map((b) => transformBlog(b)),
  };
}

export async function getBlog(rkey: string) {
  const queryParams = new URLSearchParams({
    repo: repo,
    collection: collection,
    rkey: rkey,
  });

  const response = await fetch(
    `${serviceUri}/com.atproto.repo.getRecord?${queryParams}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 400) return null;

  const json = await response.json();

  return transformBlog(Blog.parse(json));
}

function transformBlog(blog: z.infer<typeof Blog>) {
  return {
    ...blog,
    slug: `${blog.uri.rkey}-${slugify(blog.value.title, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
    })}`,
  };
}
