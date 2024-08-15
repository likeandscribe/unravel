"use server";
import { signIn } from "@/lib/auth";

export async function loginAction(_prevStart: unknown, formData: FormData) {
  const handle = formData.get("handle") as string;
  const result = await signIn(handle);
  if (result && "error" in result) {
    throw new Error(result.error);
  }
}
