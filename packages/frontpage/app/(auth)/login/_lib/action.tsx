"use server";
import { signIn } from "@/lib/auth-sign-in";
import { isValidHandle } from "@atproto/syntax";

export async function loginAction(_prevStart: unknown, formData: FormData) {
  const identifier = formData.get("identifier") as string;
  let handleOrDid = identifier;
  // Sanitize only handles
  if (
    isValidHandle(identifier) ||
    isValidHandle(identifier.replace(/^@/, ""))
  ) {
    handleOrDid = identifier.replace(/^@/, "").toLowerCase();
  }
  const result = await signIn(handleOrDid);
  if (result && "error" in result) {
    return {
      error: `An error occured while signing in (${result.error})`,
    };
  }
}
