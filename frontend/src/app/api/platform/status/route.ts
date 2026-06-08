import { NextResponse } from "next/server";

import { resolveAdminApiBaseUrl } from "@/lib/admin/backend";

export async function GET() {
  const apiBaseUrl = resolveAdminApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}/platform/status`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      {
        data: {
          maintenance: {
            enabled: false,
            message_ar: "",
            message_en: "",
            estimated_return: "",
          },
        },
      },
      { status: 200 },
    );
  }
}
