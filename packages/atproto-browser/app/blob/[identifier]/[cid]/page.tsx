import { resolveIdentity } from "@/lib/atproto-server";
import { getPds } from "@atproto/identity";
import { CSSProperties, ReactNode } from "react";

export default async function BlobPage({
  params,
}: {
  params: {
    identifier: string;
    cid: string;
  };
}) {
  const identityResult = await resolveIdentity(params.identifier);
  if (!identityResult.success) {
    return <p>{identityResult.error}</p>;
  }
  const { didDocument } = identityResult;
  const pds = getPds(didDocument);
  if (!pds) {
    return <p>No PDS found for did {didDocument.id}</p>;
  }

  const getBlobUrl = new URL(`${pds}/xrpc/com.atproto.sync.getBlob`);
  getBlobUrl.searchParams.set("cid", params.cid);
  getBlobUrl.searchParams.set("did", didDocument.id);

  const response = await fetch(getBlobUrl.toString(), {
    method: "head",
  });

  if (!response.ok) {
    return (
      <p>
        Failed to fetch blob for {params.cid}: {response.statusText}
      </p>
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType) {
    return <p>Blob {params.cid} has no content type</p>;
  }

  const mediaStyles = {
    maxHeight: "100%",
    maxWidth: "100%",
  } satisfies CSSProperties;

  if (contentType.startsWith("image/")) {
    return (
      <Wrapper>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img style={mediaStyles} alt="" src={getBlobUrl.toString()} />
      </Wrapper>
    );
  }

  if (contentType.startsWith("video/")) {
    return (
      <Wrapper>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video style={mediaStyles} controls>
          <source
            style={{ maxHeight: "auto" }}
            src={getBlobUrl.toString()}
            type={contentType}
          />
        </video>
      </Wrapper>
    );
  }

  return <p>Unsupported content type: {contentType}</p>;
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      {children}
    </div>
  );
}
