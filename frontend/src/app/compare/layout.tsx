import type { Metadata } from "next";

import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.compare.title,
  description: ar.seo.compare.description,
  path: "/compare",
});

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
