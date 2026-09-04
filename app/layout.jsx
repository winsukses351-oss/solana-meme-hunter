import './globals.css';

export const metadata = {
  title: 'Solana Meme Hunter',
  description: 'AI Meme Coin Hunter Engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
