"use client";
import Hls from "hls.js";
import { RefObject, useEffect, useRef } from "react";

export function VideoEmbedClient({
  source,
  sessionId,
}: {
  source: string;
  sessionId?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  const hlsRef = useRef<Hls | undefined>(undefined);

  useEffect(() => {
    if (!ref.current) return;
    if (!Hls.isSupported()) throw new HLSUnsupportedError();

    const hls = new Hls({
      capLevelToPlayerSize: true,
      // progressive: true enables fetch, we can then customize the request in fetchSetup
      // Can't use the default xhr loader because there appears to be no way to customise the URL there
      progressive: true,
      fetchSetup(context, initParams) {
        const url = new URL(context.url);
        if (sessionId) {
          url.searchParams.set("session_id", sessionId);
        }

        return new Request(url, initParams);
      },
    });
    hlsRef.current = hls;

    hls.attachMedia(ref.current);
    hls.loadSource(source);

    // initial value, later on it's managed by Controls
    hls.autoLevelCapping = 0;

    return () => {
      hlsRef.current = undefined;
      hls.detachMedia();
      hls.destroy();
    };
  }, [source, sessionId]);

  return <VideoEmbedWrapper videoRef={ref} />;
}

export function VideoEmbedWrapper({
  videoRef,
}: {
  videoRef?: RefObject<HTMLVideoElement>;
}) {
  return (
    <div
      style={{
        aspectRatio: "16 / 9",
        width: 500,
      }}
    >
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          preload="none"
          controls
          loop
        />
      </div>
    </div>
  );
}

export class HLSUnsupportedError extends Error {
  constructor() {
    super("HLS is not supported");
  }
}
