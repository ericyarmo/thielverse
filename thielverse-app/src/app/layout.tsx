export const metadata = { title: "Frontier Index", description: "72-hour verified memory demo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white/95 antialiased">
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </body>
    </html>
  );
}
