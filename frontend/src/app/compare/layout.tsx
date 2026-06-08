import type { Metadata } from "next";

import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.compare.title,
    description: t.seo.compare.description,
    path: "/compare",
    locale,
  });
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
