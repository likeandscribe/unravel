import "server-only";
import { z } from "zod";
import { ensureUser } from "../user";
import { DataLayerError } from "../error";
import { Prettify } from "@/lib/utils";
import { fetchAuthenticatedAtproto } from "@/lib/auth";

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
    value,
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

const CreateRecordResponse = z.object({
  uri: AtUri,
  cid: z.string(),
});

type CreateRecordInput = {
  record: unknown;
  collection: string;
};

export async function atprotoCreateRecord({
  record,
  collection,
}: CreateRecordInput) {
  const user = await ensureUser();
  const pdsUrl = new URL(user.pdsUrl);
  pdsUrl.pathname = "/xrpc/com.atproto.repo.createRecord";

  const response = await fetchAuthenticatedAtproto(pdsUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: user.did,
      collection,
      validate: false,
      record: record,
    }),
  });

  if (!response.ok) {
    throw new DataLayerError(`Failed to create record ${response.status}`, {
      cause: response,
    });
  }

  return CreateRecordResponse.parse(await response.json());
}

type DeleteRecordInput = {
  collection: string;
  rkey: string;
};

export async function atprotoDeleteRecord({
  collection,
  rkey,
}: DeleteRecordInput) {
  const user = await ensureUser();
  const pdsUrl = new URL(user.pdsUrl);
  pdsUrl.pathname = "/xrpc/com.atproto.repo.deleteRecord";

  const response = await fetchAuthenticatedAtproto(pdsUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: user.did,
      collection,
      rkey,
    }),
  });

  if (!response.ok) {
    throw new DataLayerError("Failed to delete record", { cause: response });
  }
}

const AtProtoRecord = z.object({
  value: z.custom<unknown>(
    (value) => typeof value === "object" && value != null,
  ),
  cid: z.string(),
});

type GetRecordInput = {
  serviceEndpoint: string;
  repo: string;
  collection: string;
  rkey: string;
};

export async function atprotoGetRecord({
  serviceEndpoint,
  repo,
  collection,
  rkey,
}: GetRecordInput) {
  const url = new URL(`${serviceEndpoint}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.append("repo", repo);
  url.searchParams.append("collection", collection);
  url.searchParams.append("rkey", rkey);

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok)
    throw new Error("Failed to fetch record", { cause: response });

  const json = await response.json();

  return AtProtoRecord.parse(json);
}
