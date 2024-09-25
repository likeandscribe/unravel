"use server";

//TODO: add actions for creating, updating, deleting moderation reports

export async function createModerationAction(
  _prevState: unknown,
  formData: FormData,
) {
  //create the moderation action and update the report as actioned
  return { error: "Not implemented" };
}

export async function rejectReportAction(
  _prevState: unknown,
  formData: FormData,
) {
  //reject the report and update the report as actioned
  return { error: "Not implemented" };
}
