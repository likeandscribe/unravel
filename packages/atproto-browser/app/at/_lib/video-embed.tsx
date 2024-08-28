// import HLS from "parse-hls";
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
  preload(source, {
    as: "fetch",
    crossOrigin: "anonymous",
  });
  // TODO: This doesn't work currently because the session id is different on the client, so preload doesn't match the resources requested by the client
  // const manifest = HLS.parse(
  //   await fetch(source, {
  //     next: {
  //       revalidate: 600,
  //     },
  //   }).then((res) => res.text()),
  // );
  // for (const line of manifest.lines) {
  //   if (line.type !== "URI") continue;
  //   preload(`${rootUrl}/${line.content}`, {
  //     as: "fetch",
  //     crossOrigin: "anonymous",
  //   });
  // }

  return <VideoEmbedClient source={source} />;
}
