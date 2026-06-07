import type { Metadata } from "next";

const SITE_NAME = "ArabArenaAI";
const DEFAULT_SITE_URL = "https://arabarenaai.com";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  return configured.replace(/\/+$/, "");
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
}

export function createPageMetadata({
  title,
  description,
  path,
}: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${siteUrl}${canonicalPath}`;

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
      locale: "ar_SA",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
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
  },
  twitter: {
    card: "summary",
  },
};
