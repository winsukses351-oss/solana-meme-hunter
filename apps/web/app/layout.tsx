export const metadata = {
  title: 'Solana Meme Hunter',
  description: 'Autonomous Solana Meme Coin Trading Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
