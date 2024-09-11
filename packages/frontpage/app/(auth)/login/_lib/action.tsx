"use server";
import { signIn } from "@/lib/auth-sign-in";

export async function loginAction(_prevStart: unknown, formData: FormData) {
  const handle = formData.get("handle") as string;
  const result = await signIn(handle);
  if (result && "error" in result) {
    return {
      error: `An error occured while signing in (${result.error})`,
    };
  }
}
