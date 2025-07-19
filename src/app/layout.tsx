// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { NavigationLoader } from "@/components/ui/navigation-loader"; // 1. Impor komponen

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Dashboard Donasi",
  description: "Aplikasi untuk mengelola donasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationLoader /> {/* 2. Tambahkan loader di sini */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}