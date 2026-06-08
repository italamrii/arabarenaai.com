import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

const MAINTENANCE_CACHE_MS = 30_000;
let maintenanceCache: { checkedAt: number; enabled: boolean } | null = null;

function resolveApiBaseUrl(): string {
  const fromEnv =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "").endsWith("/v1")
      ? fromEnv.replace(/\/+$/, "")
      : `${fromEnv.replace(/\/+$/, "")}/v1`;
  }
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return "https://api.arabarenaai.com/v1";
  }
  return "http://localhost:8000/v1";
}

async function isMaintenanceEnabled(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.checkedAt < MAINTENANCE_CACHE_MS) {
    return maintenanceCache.enabled;
  }

  try {
    const response = await fetch(`${resolveApiBaseUrl()}/platform/status`, {
      cache: "no-store",
    });
    if (!response.ok) {
      maintenanceCache = { checkedAt: now, enabled: false };
      return false;
    }
    const json = (await response.json()) as {
      data?: { maintenance?: { enabled?: boolean } };
    };
    const enabled = Boolean(json.data?.maintenance?.enabled);
    maintenanceCache = { checkedAt: now, enabled };
    return enabled;
  } catch {
    maintenanceCache = { checkedAt: now, enabled: false };
    return false;
  }
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isMaintenancePage(pathname: string): boolean {
  return pathname === "/maintenance";
}

function isPlatformStatusApi(pathname: string): boolean {
  return pathname === "/api/platform/status";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    if (
      pathname.startsWith("/admin/dashboard") ||
      pathname === "/api/admin/dashboard" ||
      pathname === "/api/admin/maintenance"
    ) {
      const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
      if (!(await verifyAdminSessionToken(token))) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  if (!isMaintenancePage(pathname) && !isPlatformStatusApi(pathname)) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const isAdmin = await verifyAdminSessionToken(adminToken);
    if (!isAdmin && (await isMaintenanceEnabled())) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
