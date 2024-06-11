import { getSession } from "@/lib/auth";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Link href="/login">Sign in</Link>
      <div>Hello world!</div>
      <User />
    </main>
  );
}

async function User() {
  const session = await getSession();
  if (!session) return null;
  return <pre>{JSON.stringify(session.user)}</pre>;
}
