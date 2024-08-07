import Link from "next/link";
import { AtUriForm } from "./aturi-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATProto Browser",
  description: "Browse the atmosphere.",
};

const EXAMPLE_URI =
  "at://did:plc:2xau7wbgdq4phuou2ypwuen7/app.bsky.feed.like/3kyutnrmg3s2r";

export default function Home() {
  return (
    <main>
      <h1>Enter an AT uri:</h1>
      <div style={{ maxWidth: "450px" }}>
        <AtUriForm />
      </div>
      <p>
        eg. <Link href={`/at?u=${EXAMPLE_URI}`}>{EXAMPLE_URI}</Link>
      </p>
    </main>
  );
}
