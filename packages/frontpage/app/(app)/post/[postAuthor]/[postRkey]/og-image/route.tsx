/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { getBlueskyProfile } from "@/lib/data/user";
import {
  OgBox,
  frontpageOgImageResponse,
  OgCommentIcon,
  OgVoteIcon,
  OgWrapper,
  OgBottomBar,
} from "@/lib/og";
import { getPostPageData } from "../_lib/page-data";

type Params = {
  postRkey: string;
  postAuthor: string;
};

export const dynamic = "force-static";
export const revalidate = 60 * 60; // 1 hour

export async function GET(_req: Request, { params }: { params: Params }) {
  const { post } = await getPostPageData(params);
  const { avatar } = await getBlueskyProfile(post.authorDid);

  return frontpageOgImageResponse(
    <OgWrapper
      style={{
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      <OgBox
        style={{
          backgroundColor: "#00000073",
          width: "90%",
          padding: 40,
          fontSize: 72,
          fontWeight: 700,
          textWrap: "balance",
          flexShrink: 1,
          flexGrow: 1,
          maskImage: "linear-gradient(to bottom, #fff, #fff 40%, transparent)",
        }}
      >
        {post.title}
      </OgBox>
      <OgBottomBar>
        <img
          src={avatar}
          width={48}
          height={48}
          style={{
            borderRadius: "100%",
          }}
        />
        <OgBox style={{ alignItems: "center", gap: 4 }}>
          <OgVoteIcon />
          <OgBox>
            {post.voteCount} vote{post.voteCount === 1 ? "" : "s"}
          </OgBox>
        </OgBox>
        <OgBox style={{ alignItems: "center", gap: 12 }}>
          <OgCommentIcon />
          <OgBox>
            {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
          </OgBox>
        </OgBox>
      </OgBottomBar>
    </OgWrapper>,
  );
}
