import Link from "next/link";
import { AtUriForm } from "./aturi-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATProto Browser",
  description: "Browse the atmosphere.",
};

const EXAMPLE_PATH = "tom-sherman.com/app.bsky.feed.like/3kyutnrmg3s2r";

export default function Home() {
  return (
    <main>
      <h1>Enter an AT uri or BlueSky post uri:</h1>
      <div style={{ maxWidth: "450px" }}>
        <AtUriForm />
      </div>
      <p>
        eg. <Link href={`/at/${EXAMPLE_PATH}`}>at://{EXAMPLE_PATH}</Link> or{" "}
        <Link href={`/at/danabra.mov/app.bsky.feed.post/3kyt2aywc2k2d`}>
          https://bsky.app/profile/danabra.mov/post/3kyt2aywc2k2d
        </Link>
      </p>

      <footer>
        <p>
          Developed by{" "}
          <Link href="/at/tom-sherman.com/app.bsky.actor.profile/self">
            @tom-sherman.com
          </Link>
          .{" "}
          <a href="https://github.com/likeandscribe/unravel/tree/main/packages/atproto-browser">
            Source code
          </a>
        </p>
      </footer>
    </main>
  );
}
