import './globals.css';

export const metadata = {
  title: 'Solana Meme Coin Hunter',
  description: 'AI-Powered Trading System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
