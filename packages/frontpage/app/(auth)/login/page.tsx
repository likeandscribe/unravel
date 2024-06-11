import { Label } from "@/lib/components/ui/label";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function Component() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Sign in to Frontpage
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <a
              href="https://bsky.app/"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign up on Bluesky
            </a>
            , create an application password, then return here to login.
          </p>
        </div>
        <form
          className="space-y-6"
          action={async (formData) => {
            "use server";
            formData.append("redirectTo", "/");
            await signIn(formData);
          }}
        >
          <div>
            <Label htmlFor="identifier">Handle</Label>
            <Input
              id="identifier"
              name="identifier"
              required
              placeholder="@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
            />
          </div>
          <div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
