import { headers } from "next/headers";
import { CommentCollection } from "../atproto/comment";
import { DID } from "../atproto/did";
import { PostCollection } from "../atproto/post";
import { getPostFromComment } from "./post";

export const getRootUrl = async () => {
  const host =
    process.env.NODE_ENV === "development"
      ? (await headers()).get("host")
      : process.env.VERCEL_ENV === "production"
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL!
        : process.env.VERCEL_BRANCH_URL!;

  return `https://${host}`;
};

export const createFrontPageLink = async (
  author: DID,
  collection?: string,
  rkey?: string,
) => {
  switch (collection) {
    case PostCollection:
      return `/post/${author}/${rkey}/`;

    case CommentCollection:
      const { postAuthor, postRkey } = (await getPostFromComment({
        rkey: rkey!,
        did: author!,
      }))!;
      return `/post/${postAuthor}/${postRkey}/${author}/${rkey}/`;

    default:
      return `/profile/${author}/`;
  }
};
