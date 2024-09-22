"use server";
import { signIn } from "@/lib/auth-sign-in";

export async function loginAction(_prevStart: unknown, formData: FormData) {
  const identifier = formData.get("identifier") as string;
  const result = await signIn(identifier);
  if (result && "error" in result) {
    return {
      error: `An error occured while signing in (${result.error})`,
    };
  }
}
