import { UriBar } from "./uri-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <UriBar />
      {children}
    </div>
  );
}
