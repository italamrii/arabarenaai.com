import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";

import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { CookieNotice } from "@/components/legal/cookie-notice";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { Providers } from "@/app/providers";
import { DEFAULT_LOCALE, isLocale, localeDirection, localeHtmlLang, LOCALE_COOKIE } from "@/i18n/index";
import { rootMetadata } from "@/lib/seo/metadata";

import "./globals.css";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata = rootMetadata;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={localeHtmlLang(initialLocale)}
      dir={localeDirection(initialLocale)}
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${arabicFont.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers initialLocale={initialLocale}>
          <SkipToContent />
          <SiteAnalytics />
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieNotice />
        </Providers>
      </body>
    </html>
  );
}
