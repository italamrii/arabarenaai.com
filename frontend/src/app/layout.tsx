import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/app/providers";

import "./globals.css";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArabArenaAI — مقارنة النماذج بالعربية",
  description: "منصة ArabArenaAI لمقارنة نماذج الذكاء الاصطناعي وإشارات تفضيل المجتمع",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${arabicFont.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
