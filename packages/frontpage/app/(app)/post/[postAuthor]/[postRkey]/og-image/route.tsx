/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { getPost } from "@/lib/data/db/post";
import { getBlueskyProfile } from "@/lib/data/user";
import { notFound } from "next/navigation";
import { OgBox, frontpageOgImageResponse } from "../../_og";

type Params = {
  postRkey: string;
  postAuthor: string;
};

export const dynamic = "force-static";
export const revalidate = 60 * 60; // 1 hour

export async function GET(_req: Request, { params }: { params: Params }) {
  const authorDid = await getDidFromHandleOrDid(params.postAuthor);
  if (!authorDid) notFound();
  const post = await getPost(authorDid, params.postRkey);
  if (!post) notFound();
  const { avatar } = await getBlueskyProfile(post.authorDid);

  return frontpageOgImageResponse(
    <OgBox
      style={{
        display: "flex",
        flexDirection: "column",
        color: "#020817",
        fontFamily: "Source Serif 4",
        background: "#E6E5E5",
        width: "100%",
        height: "100%",
        padding: 100,
      }}
    >
      <OgBox
        style={{
          display: "flex",
          fontSize: 94,
          fontWeight: 500,
        }}
      >
        Frontpage
      </OgBox>
      <OgBox
        style={{
          display: "flex",
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow:
            "#000000 0px 0px 0px 0px, #000000 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
          padding: 16,
          gap: 20,
        }}
      >
        <img
          src={avatar}
          width={100}
          height={100}
          style={{ borderRadius: "100%" }}
        />
        <OgBox style={{ flexDirection: "column", gap: 5, paddingRight: 20 }}>
          <OgBox style={{ fontSize: 32, textWrap: "balance" }}>
            {post.title}
          </OgBox>
          <OgBox style={{ fontFamily: "Source Sans 3", fontSize: 24 }}>
            {post.voteCount} vote{post.voteCount === 1 ? "" : "s"}.{" "}
            {post.commentCount} comment
            {post.commentCount === 1 ? "" : "s"}
          </OgBox>
        </OgBox>
      </OgBox>
    </OgBox>,
  );
}
