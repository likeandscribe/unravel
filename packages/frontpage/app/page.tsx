import { getSession } from "@/lib/auth";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Link href="/sign-in">Sign in</Link>
      <div>Hello world!</div>
      <User />
    </main>
  );
}

async function User() {
  const session = await getSession();
  if (!session) return null;
  console.log(session);
  return <pre>{JSON.stringify(session.user)}</pre>;
}
