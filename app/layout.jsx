import './globals.css';

export const metadata = {
  title: 'Solana Meme Hunter',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
