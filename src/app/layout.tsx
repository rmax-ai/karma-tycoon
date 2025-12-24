import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SimpleAnalytics from "@/components/SimpleAnalytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Karma Tycoon",
  description: "Grow your subreddit empire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SimpleAnalytics />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
