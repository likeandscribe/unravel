import { badRequest, createApiRoute } from "@/lib/api-route";
import { parseDid } from "@/lib/data/atproto/did";
import { getVerifiedHandle } from "@/lib/data/atproto/identity";
import { getBlueskyProfile, getTotalSubmissions } from "@/lib/data/user";

export const GET = createApiRoute(async (request) => {
  const url = new URL(request.url);
  const didParam = url.searchParams.get("did");

  const did = didParam ? parseDid(didParam) : null;

  if (!did) {
    badRequest("Missing did parameter");
  }

  const [submissions, handle, profile] = await Promise.all([
    getTotalSubmissions(did),
    getVerifiedHandle(did),
    getBlueskyProfile(did),
  ]);

  return {
    ...submissions,
    handle,
    avatar: profile.avatar,
  };
});
