import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MockAppDataProvider } from "@/lib/mock-data/context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Refinery PO Demo",
  description: "Frontend-only procurement demo powered by in-memory mock data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
       <MockAppDataProvider>
         <TooltipProvider>
           {children}
           <Toaster richColors position="top-right" />
         </TooltipProvider>
       </MockAppDataProvider>
      </body>
    </html>
  );
}
