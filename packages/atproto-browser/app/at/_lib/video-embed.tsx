import HLS from "parse-hls";
import { VideoEmbedClient } from "./video-embed-client";
import { preload } from "react-dom";
import { Suspense } from "react";

type VideoEmbedProps = {
  cid: string;
  did: string;
};

export async function VideoEmbed({ cid, did }: VideoEmbedProps) {
  return (
    <Suspense>
      <VideoEmbedInner cid={cid} did={did} />
    </Suspense>
  );
}

async function VideoEmbedInner({ cid, did }: VideoEmbedProps) {
  const rootUrl = `https://lumi.jazco.dev/watch/${did}/${cid}`;
  const source = `${rootUrl}/playlist.m3u8`;

  const manifest = HLS.parse(
    await fetch(source, {
      next: {
        revalidate: 600,
      },
    }).then((res) => res.text()),
  );

  // This is quite naive, but it's good enough for now
  const sessionId = manifest.streamRenditions[0]?.uri.split("session_id=")[1];

  if (sessionId) {
    const sourceUrl = new URL(source);
    sourceUrl.searchParams.set("session_id", sessionId);
    preload(sourceUrl.toString(), {
      as: "fetch",
      crossOrigin: "anonymous",
    });

    // TODO: Preload first segment
  }

  return <VideoEmbedClient source={source} sessionId={sessionId} />;
}
