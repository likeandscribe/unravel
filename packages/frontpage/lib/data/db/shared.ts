import { CommentCollection } from "../atproto/comment";
import { DID } from "../atproto/did";
import { PostCollection } from "../atproto/post";
import { getPostFromComment } from "./post";

export const createLink = async (
  collection?: string | null,
  author?: DID | null,
  rkey?: string | null,
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
