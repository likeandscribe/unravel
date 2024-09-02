import { redirect } from "next/navigation";

export function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  let url;
  try {
    url = new URL(searchParams.get("u")!);
  } catch (_) {
    return new Response("Invalid URL", { status: 400 });
  }
  if (url.hostname !== "bsky.app") {
    return new Response("Invalid URL", { status: 400 });
  }

  //  /profile/did:plc:oisofpd7lj26yvgiivf3lxsi/post/3l35xkmrbfw2h
  const match = /\/profile\/(?<identifier>[^/]+)\/post\/(?<post>[^/]+)$/.exec(
    url.pathname,
  );

  if (!match || !match.groups) {
    return new Response("Invalid URL", { status: 400 });
  }

  const { identifier, post } = match.groups;

  redirect(`/at/${identifier}/app.bsky.feed.post/${post}`);
}
