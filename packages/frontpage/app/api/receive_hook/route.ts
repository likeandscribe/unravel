import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { atprotoGetRecord } from "@/lib/data/atproto/record";
import { Commit } from "@/lib/data/atproto/event";
import * as atprotoPost from "@/lib/data/atproto/post";
import * as dbPost from "@/lib/data/db/post";
import { CommentCollection, getComment } from "@/lib/data/atproto/comment";
import { VoteRecord } from "@/lib/data/atproto/vote";
import { getPdsUrl } from "@/lib/data/atproto/did";
import { unauthed_createNotification } from "@/lib/data/db/notification";
import { atUriToString } from "@/lib/data/atproto/uri";

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
    console.log("Processing", collection, rkey, op.action);

    if (collection === atprotoPost.PostCollection) {
      if (op.action === "create") {
        const record = await atprotoGetRecord({
          serviceEndpoint: service,
          repo,
          collection,
          rkey,
        });
        const postRecord = atprotoPost.PostRecord.parse(record.value);
        await dbPost.unauthed_createPost({
          post: postRecord,
          rkey,
          authorDid: repo,
          cid: record.cid,
          offset: seq,
        });
      } else if (op.action === "delete") {
        await dbPost.unauthed_deletePost({
          rkey,
          authorDid: repo,
          offset: seq,
        });
      }
    }
    // repo is actually the did of the user
    if (collection === CommentCollection) {
      await db.transaction(async (tx) => {
        if (op.action === "create") {
          const comment = await getComment({ rkey, repo });

          const parentComment =
            comment.parent != null
              ? (
                  await tx
                    .select()
                    .from(schema.Comment)
                    .where(eq(schema.Comment.cid, comment.parent.cid))
                )[0]
              : null;

          const post = (
            await tx
              .select()
              .from(schema.Post)
              .where(eq(schema.Post.cid, comment.post.cid))
          )[0];

          if (!post) {
            throw new Error("Post not found");
          }

          if (post.status !== "live") {
            throw new Error(
              `[naughty] Cannot comment on deleted post. ${repo}`,
            );
          }
          //TODO: move this to db folder
          await tx.insert(schema.Comment).values({
            cid: comment.cid,
            rkey,
            body: comment.content,
            postId: post.id,
            authorDid: repo,
            createdAt: new Date(comment.createdAt),
            parentCommentId: parentComment?.id ?? null,
          });

          const userToNotify = parentComment
            ? parentComment.authorDid
            : post.authorDid;
          // Only notify a user if they are not the author of the post/comment
          if (userToNotify !== repo) {
            await unauthed_createNotification({
              did: userToNotify,
              reason: parentComment ? "commentReply" : "postComment",
              reasonCid: comment.cid,
              reasonUri: {
                authority: repo,
                collection: CommentCollection,
                rkey,
              },
            });
          }
        } else if (op.action === "delete") {
          await tx
            .update(schema.Comment)
            .set({ status: "deleted" })
            .where(
              and(
                eq(schema.Comment.rkey, rkey),
                eq(schema.Comment.authorDid, repo),
              ),
            );
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
            [atprotoPost.PostCollection]: schema.Post,
            [CommentCollection]: schema.Comment,
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
              `Subject not found with uri: ${atUriToString(hydratedVoteRecordValue.subject.uri)}`,
            );
          }

          if (subject.authorDid === repo) {
            throw new Error(`[naughty] Cannot vote on own content ${repo}`);
          }

          if (
            hydratedVoteRecordValue.subject.uri.collection ===
            atprotoPost.PostCollection
          ) {
            await tx.insert(schema.PostVote).values({
              postId: subject.id,
              authorDid: repo,
              createdAt: new Date(hydratedVoteRecordValue.createdAt),
              cid: hydratedRecord.cid,
              rkey,
            });
          } else if (
            hydratedVoteRecordValue.subject.uri.collection === CommentCollection
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
          // Relies on sqlite not throwing an error if the record doesn't exist.
          await tx
            .delete(schema.CommentVote)
            .where(
              and(
                eq(schema.CommentVote.rkey, rkey),
                eq(schema.CommentVote.authorDid, repo),
              ),
            );
          await tx
            .delete(schema.PostVote)
            .where(
              and(
                eq(schema.PostVote.rkey, rkey),
                eq(schema.PostVote.authorDid, repo),
              ),
            );
        }

        await tx.insert(schema.ConsumedOffset).values({ offset: seq });
      });
    }
  });

  await Promise.all(promises);

  return new Response("OK");
}
