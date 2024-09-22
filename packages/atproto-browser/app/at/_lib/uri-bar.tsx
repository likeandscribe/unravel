"use client";

import Link from "@/lib/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { AtUriForm } from "../../aturi-form";

export function UriBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams() as {
    identifier?: string;
    collection?: string;
    rkey?: string;
  };

  const uri =
    pathname === "/at"
      ? searchParams.get("u") ?? undefined
      : `at://${[params.identifier, params.collection, params.rkey]
          .map((c) => c && decodeURIComponent(c))
          .filter(Boolean)
          .join("/")}`;

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Link href="/">🏠</Link>
      <AtUriForm defaultUri={uri} style={{ flexGrow: 1 }} />
    </div>
  );
}
