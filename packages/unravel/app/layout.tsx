import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "./_theme-provider";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source_serif",
  weight: ["400", "500"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source_sans",
  weight: ["400", "500"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          sourceSans.variable,
          sourceSerif.variable,
          "bg-slate-50/50 dark:bg-slate-950 min-h-screen",
        )}
      >
        {" "}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
