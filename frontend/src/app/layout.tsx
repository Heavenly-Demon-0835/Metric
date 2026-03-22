import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Metric Fitness Logger",
  description: "Mobile-first fitness logger and diary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-foreground max-w-md mx-auto min-h-screen sm:shadow-2xl relative flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
