import "server-only";
import {
  atprotoCreateRecord,
  atprotoDeleteRecord,
  atprotoGetRecord,
} from "./record";
import { createAtUriParser } from "./uri";
import { DataLayerError } from "../error";
import { z } from "zod";
import { PostCollection } from "./post";
import { DID, getPdsUrl } from "./did";

export const CommentCollection = "fyi.unravel.frontpage.comment";

export const CommentRecord = z.object({
  content: z.string(),
  parent: z
    .object({
      cid: z.string(),
      uri: createAtUriParser(z.literal(CommentCollection)),
    })
    .optional(),
  post: z.object({
    cid: z.string(),
    uri: createAtUriParser(z.literal(PostCollection)),
  }),
  createdAt: z.string(),
});

type CommentInput = {
  parent?: { cid: string; rkey: string; authorDid: DID };
  post: { cid: string; rkey: string; authorDid: DID };
  content: string;
};

export async function createComment({ parent, post, content }: CommentInput) {
  // Collapse newlines into a single \n\n and trim whitespace
  const sanitizedContent = content.replace(/\n\n+/g, "\n\n").trim();
  const record = {
    content: sanitizedContent,
    parent: parent
      ? {
          cid: parent.cid,
          uri: `at://${parent.authorDid}/${CommentCollection}/${parent.rkey}`,
        }
      : undefined,
    post: {
      cid: post.cid,
      uri: `at://${post.authorDid}/${PostCollection}/${post.rkey}`,
    },
    createdAt: new Date().toISOString(),
  };

  CommentRecord.parse(record);

  const result = await atprotoCreateRecord({
    record,
    collection: CommentCollection,
  });

  return {
    rkey: result.uri.rkey,
  };
}

export async function deleteComment(rkey: string) {
  await atprotoDeleteRecord({
    rkey,
    collection: CommentCollection,
  });
}

export async function getComment({ rkey, repo }: { rkey: string; repo: DID }) {
  const service = await getPdsUrl(repo);

  if (!service) {
    throw new DataLayerError("Failed to get service url");
  }

  const { value, cid } = await atprotoGetRecord({
    serviceEndpoint: service,
    repo,
    collection: CommentCollection,
    rkey,
  });

  return { ...CommentRecord.parse(value), cid };
}
