import { getClientConfig } from "@/lib/auth";

export async function GET(): Promise<Response> {
  return Response.json(getClientConfig());
}
