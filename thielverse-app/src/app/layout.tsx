export const metadata = {
  title: "Thielverse — Frontier Feed",
  description: "Tracking frontier breakthroughs as civic receipts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0b0c] text-neutral-200 antialiased">
        <header className="sticky top-0 z-20 border-b border-neutral-800 bg-gradient-to-b from-[#0b0b0c] to-[#0b0b0c]/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-tight">
              Thielverse <span className="text-neutral-400">· Frontier Feed</span>
            </a>
            // ...keep your current layout, just replace the <nav> with this:

</nav>

            <nav className="hidden sm:flex gap-5 text-sm">
              <a className="hover:text-white underline-offset-4 hover:underline" href="/oracle">Demo</a>
              <a className="hover:text-white underline-offset-4 hover:underline" href="/api/openapi.json" target="_blank">OpenAPI</a>
              <a className="hover:text-white underline-offset-4 hover:underline" href="/api/schema/receipt" target="_blank">Receipt Schema</a>
              <a className="hover:text-white underline-offset-4 hover:underline" href="/api/health" target="_blank">Health</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-5 py-10 text-xs text-neutral-400">
          © {new Date().getFullYear()} Thielverse. Public view delayed 7 days.
        </footer>
      </body>
    </html>
  );
}
