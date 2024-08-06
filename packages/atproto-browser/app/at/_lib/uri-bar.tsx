"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AtUriForm } from "../../aturi-form";

export function UriBar() {
  const searchParams = useSearchParams();

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Link href="/">🏠</Link>
      <AtUriForm
        defaultUri={searchParams.get("u") ?? undefined}
        style={{ flexGrow: 1 }}
      />
    </div>
  );
}
