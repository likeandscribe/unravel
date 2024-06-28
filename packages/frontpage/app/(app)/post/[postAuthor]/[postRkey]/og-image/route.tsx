/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { getPost } from "@/lib/data/db/post";
import { getBlueskyProfile } from "@/lib/data/user";
import { notFound } from "next/navigation";
import { OgBox, frontpageOgImageResponse } from "../../../../../../lib/og";

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
        color: "#fff",
        fontFamily: "Source Serif 4",
        background:
          "linear-gradient(105.41deg, rgba(235, 117, 195, 0.25) 0%, rgba(123, 128, 233, 0.25) 100%)",
        backgroundColor: "#1e1e1e",
        width: "100%",
        height: "100%",
        padding: 64,
        paddingBottom: 40,
      }}
    >
      <svg
        viewBox="0 0 1200 630"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          opacity: 0.3,
          filter: "grayscale(100%)",
        }}
      >
        <filter id="noiseFilter" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="2"
            stitchTiles="stitch"
            shapeRendering="crispEdges"
          />
        </filter>

        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
      <OgBox
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
            maskImage:
              "linear-gradient(to bottom, #fff, #fff 40%, transparent)",
          }}
        >
          {post.title}
        </OgBox>
        <OgBox
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <OgBox
            style={{
              fontFamily: "Source Sans 3",
              fontSize: 32,
              gap: 24,
            }}
          >
            <img
              src={avatar}
              width={48}
              height={48}
              style={{
                borderRadius: "100%",
              }}
            />
            <OgBox style={{ alignItems: "center", gap: 4 }}>
              <VoteIcon />
              <OgBox>
                {post.voteCount} vote{post.voteCount === 1 ? "" : "s"}
              </OgBox>
            </OgBox>
            <OgBox style={{ alignItems: "center", gap: 12 }}>
              <CommentIcon />
              <OgBox>
                {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
              </OgBox>
            </OgBox>
          </OgBox>
          <OgBox style={{ gap: 16, alignItems: "center" }}>
            <OgBox
              style={{
                fontSize: 20,
                opacity: 0.6,
                fontFamily: "Source Sans 3",
              }}
            >
              posted on
            </OgBox>
            <OgBox style={{ fontSize: 64, fontWeight: 700 }}>Frontpage</OgBox>
          </OgBox>
        </OgBox>
      </OgBox>
    </OgBox>,
  );
}

function VoteIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.01642 14.1472C5.31861 14.4695 5.82488 14.4859 6.1472 14.1837L12.0001 8.69663L17.8529 14.1837C18.1753 14.4859 18.6815 14.4695 18.9837 14.1472C19.2858 13.8249 19.2695 13.3186 18.9473 13.0164L12.5472 7.01642C12.2395 6.72792 11.7606 6.72792 11.4529 7.01642L5.0529 13.0164C4.73056 13.3186 4.71424 13.8249 5.01642 14.1472Z"
        fill="white"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.25 12.76C2.25 14.36 3.373 15.754 4.957 15.987C6.025 16.144 7.105 16.266 8.195 16.351C8.661 16.388 9.088 16.632 9.348 17.022L12 21L14.652 17.022C14.912 16.632 15.339 16.388 15.805 16.352C16.895 16.266 17.975 16.144 19.043 15.987C20.627 15.754 21.75 14.361 21.75 12.759V6.741C21.75 5.139 20.627 3.746 19.043 3.513C16.711 3.17072 14.357 2.99926 12 3C9.608 3 7.256 3.175 4.957 3.513C3.373 3.746 2.25 5.14 2.25 6.741V12.759V12.76Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
