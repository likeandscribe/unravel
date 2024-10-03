export const ReportReasons = ["spam", "misleading", "sexual", "other"] as const;
export type ReportReasonType = (typeof ReportReasons)[number];
