import { z } from "zod";

const ReportReason = z.union([
  z.literal("spam"),
  z.literal("misleading"),
  z.literal("sexual"),
  z.literal("other"),
]);

const ReportForm = z.object({
  creatorComment: z
    .string()
    .max(250, "Comment cannot be longer than 250 characters."),
  reportReason: ReportReason,
});

export function parseReportForm(formData: FormData) {
  return ReportForm.safeParse({
    creatorComment: formData.get("creatorComment"),
    reportReason: formData.get("reportReason"),
  });
}

export const ReportReasons = ReportReason.options.map((r) => r.value);
export type ReportReasonType = z.infer<typeof ReportReason>;
