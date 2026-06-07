const DEFAULT_DEV_BASE_URL = "http://localhost:8000/v1";

/**
 * Normalize API base URL:
 * - trim whitespace
 * - strip trailing slashes
 * - collapse duplicate /v1 suffixes
 * - ensure exactly one /v1 suffix
 */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) {
    return DEFAULT_DEV_BASE_URL;
  }

  let url = raw.trim().replace(/\/+$/, "");
  url = url.replace(/\/v1(?:\/v1)+$/i, "/v1");

  if (!/\/v1$/i.test(url)) {
    url = `${url}/v1`;
  }

  return url;
}

function readApiBaseUrlFromEnv(): string | undefined {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(readApiBaseUrlFromEnv());
}

/** Single source of truth for the frontend API base (includes /v1). */
export const API_BASE_URL = getApiBaseUrl();
