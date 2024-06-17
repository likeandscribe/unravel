import { db } from "@/lib/db";
import { z } from "zod";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { atprotoGetRecord, getPdsUrl, parseAtUri } from "@/lib/data";

export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.DRAINPIPE_CONSUMER_SECRET}`) {
    console.error("Unauthorized request");
    return new Response("Unauthorized", { status: 401 });
  }
  const parsed = Message.safeParse(await request.json());
  if (!parsed.success) {
    console.error("Could not parse message from drainpipe", parsed.error);
    return new Response("Invalid request", { status: 400 });
  }

  const { ops, repo, seq } = parsed.data;
  const service = await getPdsUrl(repo);
  if (!service) {
    throw new Error("No AtprotoPersonalDataServer service found");
  }

  const promises = ops.map(async (op) => {
    const { collection, rkey } = op.path;

    if (collection === "fyi.unravel.frontpage.post") {
      await db.transaction(async (tx) => {
        if (op.action === "create") {
          const record = await atprotoGetRecord({
            serviceEndpoint: service,
            repo,
            collection,
            rkey,
          });
          const postRecord = PostRecord.parse(record.value);

          await tx.insert(schema.Post).values({
            rkey,
            cid: record.cid,
            title: postRecord.title,
            url: postRecord.url,
            authorDid: repo,
            createdAt: new Date(postRecord.createdAt),
          });
        } else if (op.action === "delete") {
          await tx.delete(schema.Post).where(eq(schema.Post.rkey, rkey));
        }

        await tx.insert(schema.ConsumedOffset).values({ offset: seq });
      });
    }

    if (collection === "fyi.unravel.frontpage.comment") {
      await db.transaction(async (tx) => {
        if (op.action === "create") {
          const record = await atprotoGetRecord({
            serviceEndpoint: service,
            repo,
            collection,
            rkey,
          });
          const commentRecord = CommentRecord.parse(record.value);

          const postRecord = (
            await tx
              .select()
              .from(schema.Post)
              .where(eq(schema.Post.cid, commentRecord.subject.cid))
          )[0];

          if (!postRecord) {
            throw new Error("Post not found");
          }

          await tx.insert(schema.Comment).values({
            cid: record.cid,
            rkey,
            body: commentRecord.content,
            postId: postRecord.id,
            authorDid: repo,
            createdAt: new Date(commentRecord.createdAt),
          });
        } else if (op.action === "delete") {
          await tx.delete(schema.Comment).where(eq(schema.Comment.rkey, rkey));
        }

        await tx.insert(schema.ConsumedOffset).values({ offset: seq });
      });
    }

    if (collection === "fyi.unravel.frontpage.vote") {
      await db.transaction(async (tx) => {
        if (op.action === "create") {
          const hydratedRecord = await atprotoGetRecord({
            serviceEndpoint: service,
            repo,
            collection,
            rkey,
          });
          const hydratedVoteRecordValue = VoteRecord.parse(
            hydratedRecord.value,
          );
          const subjectUri = parseAtUri(hydratedVoteRecordValue.subject.uri);
          if (!subjectUri) {
            throw new Error(
              `Invalid subject uri: ${hydratedVoteRecordValue.subject.uri}`,
            );
          }
          const subjectCollection = VoteSubjectCollection.parse(
            subjectUri.collection,
          );
          const subjectTable = {
            "fyi.unravel.frontpage.post": schema.Post,
            "fyi.unravel.frontpage.comment": schema.Comment,
          }[subjectCollection];

          const subject = (
            await tx
              .select()
              .from(subjectTable)
              .where(eq(subjectTable.rkey, subjectUri.rkey))
          )[0];

          if (!subject) {
            throw new Error(
              `Subject not found with uri: ${hydratedVoteRecordValue.subject.uri}`,
            );
          }

          if (subjectCollection === "fyi.unravel.frontpage.post") {
            await tx.insert(schema.PostVote).values({
              postId: subject.id,
              authorDid: repo,
              createdAt: new Date(hydratedVoteRecordValue.createdAt),
              cid: hydratedRecord.cid,
              rkey,
            });
          } else if (subjectCollection === "fyi.unravel.frontpage.comment") {
            await tx.insert(schema.CommentVote).values({
              commentId: subject.id,
              authorDid: repo,
              createdAt: new Date(hydratedVoteRecordValue.createdAt),
              cid: hydratedRecord.cid,
              rkey,
            });
          }
        } else if (op.action === "delete") {
          // Try deleting from both tables. In reality only one will have a record.
          // Relies on postgres not throwing an error if the record doesn't exist.
          await tx
            .delete(schema.CommentVote)
            .where(eq(schema.CommentVote.rkey, rkey));
          await tx
            .delete(schema.PostVote)
            .where(eq(schema.PostVote.rkey, rkey));
        }

        await tx.insert(schema.ConsumedOffset).values({ offset: seq });
      });
    }
  });

  await Promise.all(promises);

  return new Response("OK");
}

const PostRecord = z.object({
  title: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

const CommentRecord = z.object({
  content: z.string(),
  subject: z.object({
    cid: z.string(),
    uri: z.string(),
  }),
  createdAt: z.string(),
});

const VoteRecord = z.object({
  createdAt: z.string(),
  subject: z.object({
    cid: z.string(),
    uri: z.string(),
  }),
});

const voteSubjectCollectionMembers = [
  z.literal("fyi.unravel.frontpage.post"),
  z.literal("fyi.unravel.frontpage.comment"),
] as const;

const VoteSubjectCollection = z.union(voteSubjectCollectionMembers);

const Collection = z.union([
  ...voteSubjectCollectionMembers,
  z.literal("fyi.unravel.frontpage.vote"),
]);

const Path = z.string().transform((p, ctx) => {
  const collectionResult = Collection.safeParse(p.split("/")[0]);
  if (!collectionResult.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid collection: "${p.split("/")[0]}". Expected one of ${Collection.options
        .map((c) => c.value)
        .join(", ")}`,
    });
    return z.NEVER;
  }
  const rkey = p.split("/")[1];
  if (!rkey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid path: ${p}`,
    });

    return z.NEVER;
  }

  return {
    collection: collectionResult.data,
    rkey,
    full: p,
  };
});

const Operation = z.union([
  z.object({
    action: z.union([z.literal("create"), z.literal("update")]),
    path: Path,
    cid: z.string(),
  }),
  z.object({
    action: z.literal("delete"),
    path: Path,
  }),
]);

const Message = z.object({
  ops: z.array(Operation),
  repo: z.string(),
  seq: z.string().transform((x, ctx) => {
    try {
      return BigInt(x);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid BigInt",
      });

      return z.NEVER;
    }
  }),
});
