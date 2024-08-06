import { Suspense } from "react";
import { UriBar } from "./_lib/uri-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Suspense>
        <UriBar />
      </Suspense>
      {children}
    </div>
  );
}
