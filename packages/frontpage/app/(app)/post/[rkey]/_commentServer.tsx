import { getPlcDoc } from "@/lib/data";
import { CommentClient, CommentProps } from "./_comment";

export async function Comment({ author, ...props }: CommentProps) {
  const plc = await getPlcDoc(author);
  const handle = plc.alsoKnownAs
    .find((handle) => handle.startsWith("at://"))
    ?.replace("at://", "");

  return <CommentClient {...props} author={handle ?? ""} />;
}
