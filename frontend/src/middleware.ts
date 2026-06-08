import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

const MAINTENANCE_CACHE_MS = 30_000;
let maintenanceCache: { checkedAt: number; enabled: boolean } | null = null;

function isExcludedFromMaintenanceCheck(pathname: string): boolean {
  return (
    pathname === "/maintenance" ||
    pathname === "/api/platform/status" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  );
}

async function isMaintenanceEnabled(request: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.checkedAt < MAINTENANCE_CACHE_MS) {
    return maintenanceCache.enabled;
  }

  try {
    const statusUrl = new URL("/api/platform/status", request.nextUrl.origin);
    const response = await fetch(statusUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return false;
    }

    const json = (await response.json()) as {
      data?: { maintenance?: { enabled?: boolean } };
    };
    const enabled = json.data?.maintenance?.enabled === true;
    maintenanceCache = { checkedAt: now, enabled };
    return enabled;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/dashboard") || pathname === "/api/admin/dashboard") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!(await verifyAdminSessionToken(token))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (pathname === "/api/admin/maintenance") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!(await verifyAdminSessionToken(token))) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isExcludedFromMaintenanceCheck(pathname)) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const isAdmin = await verifyAdminSessionToken(adminToken);
    if (!isAdmin && (await isMaintenanceEnabled(request))) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/compare",
    "/compare/:path*",
    "/results/:path*",
    "/models",
    "/models/:path*",
    "/insights",
    "/insights/:path*",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/maintenance",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/platform/:path*",
  ],
};
