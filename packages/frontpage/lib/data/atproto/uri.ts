import { Prettify } from "@/lib/utils";
import { z } from "zod";

export const AtUri = z.string().transform((value, ctx) => {
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
  };
});

export const atUriToString = (uri: z.infer<typeof AtUri>) =>
  `at://${[uri.authority, uri.collection, uri.rkey].join("/")}`;

export function createAtUriParser<TCollection extends z.ZodType>(
  collectionSchema: TCollection,
): z.ZodType<
  Prettify<z.infer<typeof AtUri> & { collection: z.infer<TCollection> }>,
  z.ZodTypeDef,
  string
> {
  return AtUri.transform((uri, ctx) => {
    const collection = collectionSchema.safeParse(uri.collection);
    if (!collection.success) {
      collection.error.errors.forEach((e) => {
        ctx.addIssue({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: e.code as any,
          message: e.message,
        });
      });
      return z.NEVER;
    }

    return {
      ...uri,
      collection: collection.data,
    };
  });
}
