import type { Metadata } from "next";

const SITE_NAME = "ArabArenaAI";
const DEFAULT_SITE_URL = "https://www.arabarenaai.com";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  return configured.replace(/\/+$/, "");
}

import type { Locale } from "@/i18n/types";
import { localeOpenGraph } from "@/i18n/index";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  locale?: Locale;
}

export function createPageMetadata({
  title,
  description,
  path,
  locale = "ar",
}: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${siteUrl}${canonicalPath}`;

  const ogImage = `${siteUrl}/og.svg`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: localeOpenGraph(locale),
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ArabArenaAI — مقارنة النماذج بالعربية",
    template: "%s | ArabArenaAI",
  },
  description:
    "منصة ArabArenaAI لمقارنة نماذج الذكاء الاصطناعي باللغة العربية وإشارات تفضيل المجتمع",
  openGraph: {
    siteName: SITE_NAME,
    locale: "ar_SA",
    type: "website",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.svg"],
  },
};
