import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- THIS IS THE MISSING KEY!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pharos Asset Factory",
  description: "RWA Tokenization on Pharos Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}