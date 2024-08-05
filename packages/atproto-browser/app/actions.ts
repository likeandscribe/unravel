"use server";

import { redirect } from "next/navigation";

export async function navigateUri(formData: FormData) {
  const uri = formData.get("uri") as string;
  redirect(`/at?u=${uri}`);
}
