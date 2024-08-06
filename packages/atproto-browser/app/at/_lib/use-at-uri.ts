import { AtUri } from "@atproto/syntax";
import { useSearchParams } from "next/navigation";

export function useAtUri() {
  const searchParams = useSearchParams();
  return new AtUri(searchParams.get("u")!);
}
