/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import {
  OgBottomBar,
  OgBox,
  OgCommentIcon,
  OgVoteIcon,
  OgWrapper,
  frontpageOgImageResponse,
} from "@/lib/og";
import { CommentPageParams, getCommentPageData } from "../_lib/page-data";
import { getBlueskyProfile } from "@/lib/data/user";
import { shouldHideComment } from "@/lib/data/db/comment";
import { notFound } from "next/navigation";
import { getVerifiedHandle } from "@/lib/data/atproto/identity";

export const dynamic = "force-static";
export const revalidate = 60 * 60; // 1 hour

export async function GET(
  _req: Request,
  { params }: { params: CommentPageParams },
) {
  const { comment } = await getCommentPageData(params);
  if (shouldHideComment(comment) || comment.status !== "live") {
    notFound();
  }

  const [handle, profile] = await Promise.all([
    getVerifiedHandle(comment.authorDid),
    getBlueskyProfile(comment.authorDid),
  ]);

  return frontpageOgImageResponse(
    <OgWrapper
      style={{
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      <OgBox style={{ gap: 12, flexDirection: "column", flexGrow: 1 }}>
        <OgBox
          style={{
            fontSize: 32,
            fontFamily: "Source Sans 3",
          }}
        >
          @{handle}&apos;s comment:
        </OgBox>
        <OgBox
          style={{
            backgroundColor: "#00000073",
            width: "90%",
            padding: 40,
            fontSize: 72,
            fontWeight: 700,
            textWrap: "balance",
            flexGrow: 1,
            maskImage:
              "linear-gradient(to bottom, #fff, #fff 40%, transparent)",
          }}
        >
          {comment.body}
        </OgBox>
      </OgBox>
      <OgBottomBar>
        {profile ? (
          <img
            src={profile.avatar}
            width={48}
            height={48}
            style={{
              borderRadius: "100%",
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "100%",
              backgroundColor: "#00000073",
            }}
          />
        )}
        <OgBox style={{ alignItems: "center", gap: 4 }}>
          <OgVoteIcon />
          <OgBox>
            {comment.voteCount} vote{comment.voteCount === 1 ? "" : "s"}
          </OgBox>
        </OgBox>
        <OgBox style={{ alignItems: "center", gap: 12 }}>
          <OgCommentIcon />
          <OgBox>
            {comment.children!.length}{" "}
            {comment.children!.length === 1 ? "reply" : "replies"}
          </OgBox>
        </OgBox>
      </OgBottomBar>
    </OgWrapper>,
  );
}
