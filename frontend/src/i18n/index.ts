import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";
import type { Locale, Messages } from "@/i18n/types";

export type { Locale, Messages };

export const LOCALES = ["ar", "en"] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_STORAGE_KEY = "arabarenaai_locale";
export const LOCALE_COOKIE = "arabarenaai_locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en";
}

export function getMessages(locale: Locale): Messages {
  return (locale === "en" ? en : ar) as Messages;
}

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function localeHtmlLang(locale: Locale): string {
  return locale === "ar" ? "ar" : "en";
}

export function localeOpenGraph(locale: Locale): string {
  return locale === "ar" ? "ar_SA" : "en_US";
}
