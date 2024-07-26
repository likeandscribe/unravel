"use server";

import {
  CommentCollection,
  createComment,
  deleteComment,
} from "@/lib/data/atproto/comment";
import { DID } from "@/lib/data/atproto/did";
import { deletePost } from "@/lib/data/atproto/post";
import { createVote, deleteVote } from "@/lib/data/atproto/vote";
import { getComment, uncached_doesCommentExist } from "@/lib/data/db/comment";
import { getPost } from "@/lib/data/db/post";
import { getVoteForComment } from "@/lib/data/db/vote";
import { ensureUser } from "@/lib/data/user";
import { createHeadlessEditor } from "@lexical/headless";
import {
  SerializedEditorState,
  $parseSerializedNode,
  LexicalEditor,
  $getRoot,
  EditorState,
  LexicalNode,
  $isTextNode,
  $isElementNode,
  RootNode,
} from "lexical";
import { $dfs } from "@lexical/utils";
import { revalidatePath } from "next/cache";

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

function editorStateToCommentContent(editorState: EditorState) {
  return editorState.read(() => {
    const root = $getRoot();
    const content = $nodeToCommentContent(root);
    const text = root.getTextContent();
  });
}

const FORMATS = ["bold", "italic", "strikethrough"] as const;

type CommentFacet =
  | {
      $type: "fyi.frontpage.richtext.facet#format";
      format: (typeof FORMATS)[number];
    }
  | {
      $type: "fyi.frontpage.richtext.facet#link";
      uri: string;
    };

type CommentContent =
  | string
  | { content: CommentContent; facets: CommentFacet[] }
  | CommentContent[];

function $nodeToCommentContent(node: LexicalNode): CommentContent {
  if ($isTextNode(node)) {
    console.log("text node", node);
    const formats = FORMATS.filter((format) => node.hasFormat(format));
    if (formats.length === 0) {
      return node.getTextContent();
    }

    return {
      content: node.getTextContent(),
      facets: formats.map((format) => ({
        $type: "fyi.frontpage.richtext.facet#format",
        format,
      })),
    };
  } else if ($isElementNode(node)) {
    console.log("element node", node);
    return node.getChildren().map($nodeToCommentContent);
  } else {
    throw new Error("Unknown node type");
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
