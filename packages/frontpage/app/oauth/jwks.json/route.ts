import { getPublicJwk } from "@/lib/auth";

export async function GET() {
  // TODO: Rotate keys periodically
  return Response.json({
    keys: [await getPublicJwk()],
  });
}
