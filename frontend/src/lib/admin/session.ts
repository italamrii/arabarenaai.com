export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD?.trim() || undefined;
}

function getAdminSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET?.trim() || undefined;
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword() && getAdminSessionSecret());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function signPayload(expiresAtMs: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(expiresAtMs));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const expiresAtMs = String(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  const signature = await signPayload(expiresAtMs, secret);
  return `${expiresAtMs}.${signature}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = getAdminSessionSecret();
  if (!secret || !token) return false;

  const [expiresAtMs, signature] = token.split(".");
  if (!expiresAtMs || !signature) return false;

  const expiresAt = Number(expiresAtMs);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = await signPayload(expiresAtMs, secret);
  return timingSafeEqual(signature, expected);
}

export function verifyAdminPassword(password: string): boolean {
  const expectedPassword = getAdminPassword();
  if (!expectedPassword) return false;

  const provided = password.trim();
  return timingSafeEqual(provided, expectedPassword);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}
