import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZK Shroud Arena - Battle Royale with Zero-Knowledge Proofs",
  description: "Experience the future of battle royale gaming with privacy-preserving zero-knowledge location proofs. Compete in shrinking arenas while keeping your strategic position secret.",
  keywords: ["ZK", "zero-knowledge", "battle-royale", "privacy", "cryptography", "gaming", "blockchain"],
  authors: [{ name: "ZK Shroud Arena Team" }],
  openGraph: {
    title: "ZK Shroud Arena - Battle Royale with Zero-Knowledge Proofs",
    description: "Privacy-preserving battle royale with cryptographic location verification",
    type: "website",
    siteName: "ZK Shroud Arena",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${inter.variable} antialiased bg-black text-white min-h-screen overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
