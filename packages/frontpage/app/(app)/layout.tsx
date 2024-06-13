import { getSession, signOut } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/lib/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex place-content-between items-center mb-8">
          <div className="flex">
            <Link href="/">
              <h1 className="text-2xl font-bold">Frontpage</h1>
            </Link>
            <Button className="ml-4" asChild>
              <Link href="/post/new">New</Link>
            </Button>
            <a href="" className="ml-4"></a>
          </div>
          <Suspense>
            <LoginOrLogout />
          </Suspense>
        </div>
        {children}
      </div>
    </div>
  );
}

async function LoginOrLogout() {
  const session = await getSession();
  if (session) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button>Logout ({session.user.name})</button>
      </form>
    );
  }

  return <Link href="/login">Login</Link>;
}
