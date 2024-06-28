import { ImageResponse } from "next/og";

export function OgBox({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div style={{ ...style, display: "flex" }} {...props} />;
}

export async function frontpageOgImageResponse(element: React.ReactElement) {
  return new ImageResponse(element, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    width: 1200,
    height: 630,
    fonts: await Promise.all([
      loadGoogleFont("Source Serif 4", 400),
      loadGoogleFont("Source Serif 4", 500),
      loadGoogleFont("Source Sans 3", 400),
    ]),
  });
}

async function loadGoogleFont(name: string, weight: 400 | 500 | 700) {
  const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@${weight}`;
  console.log(url);

  const css = await (
    await fetch(url, {
      cache: "force-cache",
    })
  ).text();

  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const res = await fetch(resource[1]!);
    if (res.status == 200) {
      return {
        name,
        data: await res.arrayBuffer(),
        style: "normal" as const,
        weight,
      };
    }
  }

  throw new Error("failed to load font data");
}
