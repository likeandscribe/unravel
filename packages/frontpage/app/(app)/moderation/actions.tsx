"use server";

//TODO: add actions for creating, updating, deleting moderation reports

export async function createModerationAction(
  _prevState: unknown,
  formData: FormData,
) {
  const test = !!formData.get("test");
  //create the moderation action and update the report as actioned
  console.log("Creating moderation action", test);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { error: "Not implemented", test: test };
}

export async function rejectReportAction(
  _prevState: unknown,
  formData: FormData,
) {
  const test = !!formData.get("test");
  //reject the report and update the report as actioned
  console.log("Rejecting report", test);
  return { error: "Not implemented", test: test };
}
