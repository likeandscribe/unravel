import { LoginForm } from "./_lib/form";

export default function LoginPage() {
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
            , then return here to login.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
