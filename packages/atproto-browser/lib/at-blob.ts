import { z } from "zod";

export const AtBlob = z.object({
  $type: z.literal("blob"),
  ref: z.object({
    $link: z.string(),
  }),
  mimeType: z.string(),
  size: z.number(),
});
