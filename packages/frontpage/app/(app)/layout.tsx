import { deleteAuthCookie, getSession, signOut } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/lib/components/ui/button";
import { isAdmin } from "@/lib/data/user";
import { BellIcon, OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { ThemeToggleMenuGroup } from "./_components/theme-toggle";
import {
  getDidFromHandleOrDid,
  getVerifiedHandle,
} from "@/lib/data/atproto/identity";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/lib/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { UserAvatar } from "@/lib/components/user-avatar";
import { FRONTPAGE_ATPROTO_HANDLE } from "@/lib/constants";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NotificationIndicator } from "./_components/notification-indicator";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <div className="container mx-auto px-4 md:px-6 pt-4 md:py-12 max-w-3xl">
      <div className="flex place-content-between items-center mb-8">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/frontpage-logo.svg" alt="Frontpage" className="h-12" />
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <Button asChild>
              <Link href="/post/new">New</Link>
            </Button>
          ) : null}
          <Suspense>
            <LoginOrLogout />
          </Suspense>
        </div>
      </div>

      <main className="mb-6">{children}</main>

      <footer className="flex justify-between items-center text-gray-500 dark:text-gray-400">
        <p>
          Made by{" "}
          <a
            href={`https://bsky.app/profile/${FRONTPAGE_ATPROTO_HANDLE}`}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            @unravel.fyi <OpenInNewWindowIcon className="inline" />
          </a>
        </p>
      </footer>
    </div>
  );
}

async function LoginOrLogout() {
  const session = await getSession();
  if (session) {
    const [did, handle] = await Promise.all([
      getDidFromHandleOrDid(session.user.username),
      getVerifiedHandle(session.user.did),
    ]);
    return (
      <>
        <NotificationIndicator>
          <Button asChild variant="outline" size="icon">
            <Link href="/notifications">
              <BellIcon />
            </Link>
          </Button>
        </NotificationIndicator>
        <DropdownMenu>
          <DropdownMenuTrigger>
            {did ? (
              <UserAvatar did={did} size="smedium" />
            ) : (
              <span>{handle}</span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="bottom" align="end">
            <DropdownMenuLabel className="truncate">{handle}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${handle}`} className="cursor-pointer">
                Profile
              </Link>
            </DropdownMenuItem>
            <Suspense fallback={null}>
              {isAdmin().then((isAdmin) =>
                isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/moderation" className="cursor-pointer">
                      Moderation
                    </Link>
                  </DropdownMenuItem>
                ) : null,
              )}
            </Suspense>
            <ThemeToggleMenuGroup />
            <DropdownMenuSeparator />
            <form
              action={async () => {
                "use server";
                await signOut();
                deleteAuthCookie(await cookies());
                revalidatePath("/", "layout");
              }}
            >
              <DropdownMenuItem asChild>
                <button
                  type="submit"
                  className="w-full text-start cursor-pointer"
                >
                  Logout
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  return (
    <Button variant="outline" asChild>
      <Link href="/login">Login</Link>
    </Button>
  );
}
