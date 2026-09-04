import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SyncManager from "@/components/SyncManager";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Metric Fitness Logger",
  description: "Mobile-first fitness logger and diary",
};

// viewportFit: "cover" is what makes env(safe-area-inset-bottom) resolve to a
// real value on notched iPhones, so the tab bar clears the home indicator.
export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased bg-background text-foreground max-w-md mx-auto min-h-screen relative flex flex-col`}>
        <SyncManager />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
