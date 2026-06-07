import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { loadAdminDashboardData } from "@/lib/admin/backend";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await loadAdminDashboardData();
  return NextResponse.json({
    data,
    spendingLimits: null,
  });
}
