"use server";

import { CommentCollection, deleteComment } from "@/lib/data/atproto/comment";
import { DID } from "@/lib/data/atproto/did";
import { deletePost } from "@/lib/data/atproto/post";
import { createVote, deleteVote } from "@/lib/data/atproto/vote";
import { getComment, uncached_doesCommentExist } from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { getVoteForComment } from "@/lib/data/db/vote";
import { ensureUser } from "@/lib/data/user";
import { createHeadlessEditor } from "@lexical/headless";
import { SerializedEditorState, RootNode } from "lexical";
import { editorStateToCommentContent } from "./editor-state-to-comment-content";

export async function createCommentAction(input: {
  parentRkey?: string;
  postRkey: string;
  postAuthorDid: DID;
  content: SerializedEditorState;
}) {
  const user = await ensureUser();

  const [post, comment] = await Promise.all([
    getPost(input.postAuthorDid, input.postRkey),
    input.parentRkey
      ? getComment(input.parentRkey).then((c) => {
          if (!c) throw new Error("Comment not found");
          return c;
        })
      : undefined,
  ]);

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.status !== "live") {
    throw new Error(`[naughty] Cannot comment on deleted post. ${user.did}`);
  }

  const state = createHeadlessEditor().parseEditorState(input.content);
  editorStateToCommentContent(state);

  // const { rkey } = await createComment({
  //   content,
  //   post,
  //   parent: comment,
  // });
  // await waitForComment(rkey);
  // revalidatePath(`/post`);
}

const MAX_POLLS = 15;
async function waitForComment(rkey: string) {
  let exists = false;
  let polls = 0;
  while (!exists && polls < MAX_POLLS) {
    exists = await uncached_doesCommentExist(rkey);
    await new Promise((resolve) => setTimeout(resolve, 250));
    polls++;
  }
  if (!exists) {
    throw new Error(`Comment not found after polling: ${rkey}`);
  }
}

export async function deletePostAction(rkey: string) {
  await deletePost(rkey);
}

export async function deleteCommentAction(rkey: string) {
  await ensureUser();
  await deleteComment(rkey);
}

export async function commentVoteAction(input: {
  cid: string;
  rkey: string;
  authorDid: DID;
}) {
  await ensureUser();
  await createVote({
    subjectAuthorDid: input.authorDid,
    subjectCid: input.cid,
    subjectRkey: input.rkey,
    subjectCollection: CommentCollection,
  });
}

export async function commentUnvoteAction(commentId: number) {
  await ensureUser();
  const vote = await getVoteForComment(commentId);
  if (!vote) {
    console.error("Vote not found for comment", commentId);
    return;
  }

  await deleteVote(vote.rkey);
}
function $getDepth(node: RootNode) {
  throw new Error("Function not implemented.");
}
