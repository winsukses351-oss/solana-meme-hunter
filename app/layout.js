import "./globals.css";

export const metadata = {
  title: "SOLANA AI TRADER — Phase 1 Foundation UI",
  description: "Professional Solana Meme-Coin Trading Terminal UI",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0e14] text-slate-200 antialiased min-h-screen selection:bg-purple-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}

