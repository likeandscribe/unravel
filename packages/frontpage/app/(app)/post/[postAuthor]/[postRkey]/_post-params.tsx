import { getVerifiedDid } from "@/lib/data/user";
import { notFound } from "next/navigation";

export type PostParams = {
  postRkey: string;
  postAuthor: string;
};

export async function resolvePostParams({ postAuthor, ...params }: PostParams) {
  const decodedAuthor = decodeURIComponent(postAuthor);
  if (decodedAuthor.startsWith("did:")) {
    return {
      ...params,
      authorDid: decodedAuthor,
    };
  }

  const authorDid = await getVerifiedDid(decodedAuthor);
  if (!authorDid) {
    notFound();
  }

  return {
    ...params,
    authorDid,
  };
}
