export const metadata = {
  title: "SOLANA AI TRADER — Phase 1 Foundation UI",
  description: "Professional Solana Meme-Coin Trading Terminal UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#0b0e14] text-slate-200 antialiased min-h-screen selection:bg-purple-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
