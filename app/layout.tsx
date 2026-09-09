import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Solana AI Meme Coin Hunter & Autonomous Trader",
  description: "Autonomous Solana Meme Coin Trading System",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col antialiased selection:bg-brandAccent selection:text-black">
        <Navbar />
        <main className="flex-1 pb-8">{children}</main>
      </body>
    </html>
  );
}
