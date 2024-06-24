import { notFound } from "next/navigation";
import unicorn from "./unravel-unicorn.json";
import crypto from "node:crypto";

const HASH = crypto
  .createHash("md5")
  .update(JSON.stringify(unicorn))
  .digest("hex");

export const dynamic = "force-static";

type Params = { hash: string };

export function generateStaticParams(): Params[] {
  console.log("Generated unravel-unicorn hash:", HASH);

  return [{ hash: HASH }];
}

export function GET(_: Request, { params }: { params: Params }) {
  console.log(params);
  if (params.hash !== HASH) notFound();
  return Response.json(unicorn);
}
