import { OpenInNewWindowIcon } from "@radix-ui/react-icons";

export const runtime = "edge";

export default function ClosedBeta() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Frontpage is in closed beta
      </h1>

      <div className="flex flex-col gap-3">
        <p>
          While we work out the kinks, participating on Frontpage is
          invite-only.
        </p>
        <p>
          Please DM us on Bluesky{" "}
          <a
            href="https://bsky.app/profile/unravel.fyi"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            @unravel.fyi <OpenInNewWindowIcon className="inline" />
          </a>{" "}
          and we&apos;ll invite you ASAP. Thanks!
        </p>
        <p>
          Here&apos;s a list of things that are currently broken and/or
          we&apos;re working on:
        </p>
        <ul className="list-disc list-inside">
          <li>Comment and post voting</li>
          <li>Comment replies</li>
          <li>Comment deletion</li>
          <li>Allow reading deleted posts and comment threads</li>
          <li>Rank homepage and comments by hotness</li>
        </ul>
      </div>
    </main>
  );
}
