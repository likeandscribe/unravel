import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATProto Browser",
  description: "Browse the atmosphere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
