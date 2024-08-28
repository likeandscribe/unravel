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
  const manifestText = await fetch(source, {
    next: {
      revalidate: 600,
    },
  }).then((res) => res.text());

  const manifest = HLS.parse(manifestText);

  const streamRenditionUri = manifest.streamRenditions[0]?.uri;
  const sessionId = streamRenditionUri?.split("session_id=")[1];

  if (streamRenditionUri && sessionId) {
    // This is quite naive, but it's good enough for now
    const sourceUrl = new URL(source);
    sourceUrl.searchParams.set("session_id", sessionId);
    preload(sourceUrl.toString(), {
      as: "fetch",
      crossOrigin: "anonymous",
    });

    preload(`${rootUrl}/${streamRenditionUri}`, {
      as: "fetch",
      crossOrigin: "anonymous",
    });

    // TODO: Preload first segment
  }

  return <VideoEmbedClient source={source} sessionId={sessionId} />;
}
