import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function Login() {
  return (
    <form
      action={async (formData) => {
        "use server";
        await signIn(formData);
        redirect("/");
      }}
    >
      <label>
        Handle
        <input name="identifier" />
      </label>
      <label>
        Password
        <input name="password" type="password" />
      </label>
      <button>Sign In</button>
    </form>
  );
}
