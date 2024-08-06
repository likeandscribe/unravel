"use client";
import type { AtBlob } from "./at-blob";
import type { z } from "zod";
import { useAtUri } from "./use-at-uri";

export function BlobImage({ blob }: { blob: z.infer<typeof AtBlob> }) {
  const uri = useAtUri();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${uri.host}/${blob.ref.$link}@jpeg`}
      alt=""
      width={200}
    />
  );
}
