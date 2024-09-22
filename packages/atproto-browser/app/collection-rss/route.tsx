import { listRecords } from "@/lib/atproto";
import { resolveIdentity } from "@/lib/atproto-server";
import { getAtUriPath } from "@/lib/util";
import { getHandle, getPds } from "@atproto/identity";
import { AtUri } from "@atproto/syntax";

export const revalidate = 60;

const ORIGIN = "https://atproto-browser.vercel.app";

export async function GET(request: Request) {
  const uri = new AtUri(new URL(request.url).searchParams.get("u")!);
  if (!uri.origin || uri.rkey) {
    return new Response("Invalid collection URI", { status: 400 });
  }
  const identityResult = await resolveIdentity(uri.host);
  if (!identityResult.success) {
    return new Response(identityResult.error, { status: 400 });
  }

  const didDoc = identityResult.didDocument;
  const pds = getPds(didDoc);
  if (!pds) {
    return new Response(`No PDS found for ${didDoc.id}`, { status: 400 });
  }
  const handle = getHandle(didDoc);
  if (!handle) {
    return new Response(`No handle found for ${didDoc.id}`, { status: 400 });
  }

  const { records } = await listRecords(pds, didDoc.id, uri.collection);

  const rss = `
  <rss version="2.0">
    <channel>
      <title>@${handle}'s ${uri.collection} atproto records</title>
      <link>${ORIGIN}/collection-rss?u=${uri.toString()}</link>
      <description>Collection ${uri.collection} from ${uri.origin}</description>
      <language>en-gb</language>
      <ttl>60</ttl>
      ${records
        .map((record) =>
          `
          <item>
            <title>${cdata(`New ${uri.collection}: ${new AtUri(record.uri).rkey}`)}</title>
            <pubDate>${new Intl.DateTimeFormat("fr-CA", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date())}</pubDate>
            <link>${ORIGIN}${getAtUriPath(uri)}</link>
            <guid isPermalink="false">${record.cid}</guid>
          </item>
        `.trim(),
        )
        .join("\n")}
    </channel>
  </rss>
`.trim();

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": String(new TextEncoder().encode(rss).length),
    },
  });
}

function cdata(s: string) {
  return `<![CDATA[${s}]]>`;
}
