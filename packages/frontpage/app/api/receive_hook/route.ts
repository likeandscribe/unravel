import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { atprotoGetRecord } from "@/lib/data/atproto/record";
import { getPdsUrl } from "@/lib/data/user";
import { Commit } from "@/lib/data/atproto/event";
import { PostRecord } from "@/lib/data/atproto/post";
import { CommentRecord } from "@/lib/data/atproto/comment";
import { VoteRecord } from "@/lib/data/atproto/vote";

export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.DRAINPIPE_CONSUMER_SECRET}`) {
    console.error("Unauthorized request");
    return new Response("Unauthorized", { status: 401 });
  }
  const commit = Commit.safeParse(await request.json());
  if (!commit.success) {
    console.error("Could not parse commit from drainpipe", commit.error);
    return new Response("Invalid request", { status: 400 });
  }

  const { ops, repo, seq } = commit.data;
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
          await tx
            .update(schema.Post)
            .set({ status: "deleted" })
            .where(eq(schema.Post.rkey, rkey));
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

          if (postRecord.status !== "live") {
            throw new Error(
              `[naughty] Cannot comment on deleted post. ${repo}`,
            );
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
          await tx
            .update(schema.Comment)
            .set({ status: "deleted" })
            .where(eq(schema.Comment.rkey, rkey));
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

          const subjectTable = {
            "fyi.unravel.frontpage.post": schema.Post,
            "fyi.unravel.frontpage.comment": schema.Comment,
          }[hydratedVoteRecordValue.subject.uri.collection];

          const subject = (
            await tx
              .select()
              .from(subjectTable)
              .where(
                eq(subjectTable.rkey, hydratedVoteRecordValue.subject.uri.rkey),
              )
          )[0];

          if (!subject) {
            throw new Error(
              `Subject not found with uri: ${hydratedVoteRecordValue.subject.uri.value}`,
            );
          }

          if (subject.authorDid === repo) {
            throw new Error(`[naughty] Cannot vote on own content ${repo}`);
          }

          if (
            hydratedVoteRecordValue.subject.uri.collection ===
            "fyi.unravel.frontpage.post"
          ) {
            await tx.insert(schema.PostVote).values({
              postId: subject.id,
              authorDid: repo,
              createdAt: new Date(hydratedVoteRecordValue.createdAt),
              cid: hydratedRecord.cid,
              rkey,
            });
          } else if (
            hydratedVoteRecordValue.subject.uri.collection ===
            "fyi.unravel.frontpage.comment"
          ) {
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
