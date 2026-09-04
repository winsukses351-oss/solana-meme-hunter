export const metadata = {
  title: 'Solana Meme Hunter',
  description: 'AI Meme Coin Hunter Engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
