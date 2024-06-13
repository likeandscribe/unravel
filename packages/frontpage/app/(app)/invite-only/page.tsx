import { OpenInNewWindowIcon } from "@radix-ui/react-icons";

export default function ClosedBeta() {
  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        Frontpage is in closed beta
      </h1>

      <p>
        While we work out the kinks, participating on Frontpage is invite-only.
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
    </main>
  );
}
