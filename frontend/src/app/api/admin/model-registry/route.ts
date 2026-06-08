import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { adminBackendHeaders, resolveAdminApiSecret } from "@/lib/admin/api-secret";
import { resolveAdminApiBaseUrl } from "@/lib/admin/backend";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await verifyAdminSessionToken(token))) {
    return null;
  }
  return token;
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const apiBaseUrl = resolveAdminApiBaseUrl();
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const response = await fetch(`${apiBaseUrl}/admin/model-registry${query}`, {
    cache: "no-store",
    headers: adminBackendHeaders(),
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!resolveAdminApiSecret()) {
    return NextResponse.json({ error: "admin_secret_not_configured" }, { status: 503 });
  }

  const payload = await request.json();
  const apiBaseUrl = resolveAdminApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/admin/model-registry`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...adminBackendHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
