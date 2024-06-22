import "server-only";
import { z } from "zod";
import { CommentCollection } from "./comment";
import { PostCollection } from "./post";

// This module refers to the event emitted by the Firehose

export const Collection = z.union([
  z.literal(PostCollection),
  z.literal(CommentCollection),
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
    value: p,
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

export const Commit = z.object({
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
