import { getSession, signOut } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/lib/components/ui/button";
import { isBetaUser } from "@/lib/data/user";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "./_components/theme-toggle";
import { DID, getDidFromHandleOrDid } from "@/lib/data/atproto/did";
import { UserAvatar } from "@/lib/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/lib/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isInBeta = await isBetaUser();
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
      <div className="flex place-content-between items-center mb-8">
        <div className="flex">
          <Link href="/">
            <span className="font-serif text-2xl font-bold">Frontpage</span>
          </Link>
          {session ? (
            <Button className="ml-4" asChild>
              <Link href="/post/new">New</Link>
            </Button>
          ) : null}
        </div>
        <Suspense>
          <LoginOrLogout />
        </Suspense>
      </div>

      {session ? (
        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900/50 dark:text-slate-300 p-4 mb-4 gap-2 rounded-md">
          <span>
            {isInBeta ? (
              <>
                Thanks for joining the beta! There will be bugs! Please the
                report them to{" "}
                <a
                  href="https://bsky.app/profile/unravel.fyi"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  @unravel.fyi <OpenInNewWindowIcon className="inline" />
                </a>
                !
              </>
            ) : (
              <>You&apos;re not currently part of the beta</>
            )}
          </span>

          {!isInBeta && (
            <Button
              asChild
              variant="ghost"
              className="text-indigo-600 dark:text-indigo-400"
            >
              <Link href="/invite-only">Learn more</Link>
            </Button>
          )}
        </div>
      ) : null}

      <main className="mb-6">{children}</main>

      <footer className="flex justify-between items-center text-gray-500 dark:text-gray-400">
        <p>
          Made by{" "}
          <a
            href="https://bsky.app/profile/unravel.fyi"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            @unravel.fyi <OpenInNewWindowIcon className="inline" />
          </a>
        </p>
        <div>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}

async function LoginOrLogout() {
  const session = await getSession();
  if (session) {
    const did = await getDidFromHandleOrDid(session.user.name as string);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          {did ? (
            <UserAvatar did={did as DID} size="smedium" />
          ) : (
            <span>{session.user.name}</span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="bottom" align="end">
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              {/* <User className="mr-2 h-4 w-4" /> */}
              <Link href={`/profile/${session.user.name}`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {/* <LogOut className="mr-2 h-4 w-4" /> */}
              <button type="submit">Logout</button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return <Link href="/login">Login</Link>;
}
