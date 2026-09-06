import "./globals.css";

export const metadata = {
  title: "Solana AI Trader",
  description: "Phase 2 — Backend + Database Foundation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
