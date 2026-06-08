import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { buildRecentActivity } from "@/lib/admin/activity";
import { loadAdminDashboardData } from "@/lib/admin/backend";
import { buildErrorMonitoring, buildExecutionErrors } from "@/lib/admin/errors";
import { buildModelStats, unhealthyProviderKeysFromHealth } from "@/lib/admin/model-stats";
import { buildProviderStatusOverview } from "@/lib/admin/providers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session";
import { loadSystemOverview } from "@/lib/admin/system-info";
import type { AdminDashboardPayload } from "@/lib/admin/types";

function buildDashboardPayload(
  data: Awaited<ReturnType<typeof loadAdminDashboardData>>,
): AdminDashboardPayload {
  const unhealthyKeys = unhealthyProviderKeysFromHealth(data.providerHealth);

  return {
    ...data,
    systemOverview: loadSystemOverview(data.health?.version),
    providerStatuses: buildProviderStatusOverview(data.providerHealth),
    modelStats: buildModelStats(data.models, unhealthyKeys),
    recentActivity: buildRecentActivity(data.adminStats?.recent_activity),
    errorMonitoring: buildErrorMonitoring(data),
    executionErrors: buildExecutionErrors(data.adminStats?.recent_errors),
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const data = await loadAdminDashboardData();
    return NextResponse.json({
      data: buildDashboardPayload(data),
      spendingLimits: null,
    });
  } catch {
    const data = await loadAdminDashboardData();
    return NextResponse.json({
      data: buildDashboardPayload(data),
      spendingLimits: null,
    });
  }
}
