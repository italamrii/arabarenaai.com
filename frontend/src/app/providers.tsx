"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { LocaleProvider } from "@/i18n/locale-context";
import type { Locale } from "@/i18n/types";
import { getQueryClient } from "@/lib/query-client";

interface ProvidersProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function Providers({ children, initialLocale }: ProvidersProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </LocaleProvider>
  );
}
