import { NextResponse } from "next/server";

import { checkAdminLoginRateLimit, resetAdminLoginRateLimit } from "@/lib/admin/rate-limit";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin/session";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rateLimit = checkAdminLoginRateLimit(clientKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_seconds: rateLimit.retryAfterSeconds },
      { status: 429 },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  resetAdminLoginRateLimit(clientKey(request));

  const token = await createAdminSessionToken();
  if (!token) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}
