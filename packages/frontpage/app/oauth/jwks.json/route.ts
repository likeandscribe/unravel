import { getPublicJwk } from "@/lib/auth";
import { exportJWK } from "jose";

export async function GET() {
  // TODO: Rotate keys periodically
  return Response.json({
    keys: [await exportJWK(await getPublicJwk())],
  });
}
