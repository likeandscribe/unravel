/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { frontpageOgImageResponse } from "@/lib/og";
import { CommentPageParams, getCommentPageData } from "../_lib/page-data";

export const dynamic = "force-static";
export const revalidate = 60 * 60; // 1 hour

export async function GET(
  _req: Request,
  { params }: { params: CommentPageParams },
) {
  const _data = await getCommentPageData(params);

  return frontpageOgImageResponse(<div>Hello</div>);
}
