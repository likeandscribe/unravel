"use server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prevStart: unknown, formData: FormData) {
  try {
    formData.set("redirectTo", "/");
    await signIn(formData);
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to sign in." };
    }
    throw error;
  }
}
