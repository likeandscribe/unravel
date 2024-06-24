export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
      {children}
    </main>
  );
}
