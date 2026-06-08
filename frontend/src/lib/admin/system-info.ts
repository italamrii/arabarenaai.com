import packageJson from "../../../package.json";

import { resolveAdminApiBaseUrl } from "@/lib/admin/backend";

export interface SystemOverview {
  applicationVersion: string | null;
  gitCommit: string | null;
  lastDeploymentTime: string | null;
  environment: string | null;
  apiBaseUrl: string | null;
  refreshedAt: string | null;
}

const NOT_AVAILABLE_AR = "غير متوفر";

function readOptionalEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

function resolveEnvironment(): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production") return "Production";
  if (vercelEnv === "preview") return "Preview";
  if (vercelEnv === "development") return "Development";

  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  if (nodeEnv === "production") return "Production";
  return "Development";
}

function formatGitCommit(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.length > 12 ? trimmed.slice(0, 12) : trimmed;
}

function formatDeploymentTime(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return trimmed;
}

export function loadSystemOverview(backendVersion: string | null | undefined): SystemOverview {
  try {
    const applicationVersion =
      (backendVersion && backendVersion.trim()) ||
      (typeof packageJson.version === "string" ? packageJson.version : null);

    const gitCommit = formatGitCommit(
      readOptionalEnv("VERCEL_GIT_COMMIT_SHA", "GIT_COMMIT", "COMMIT_SHA"),
    );

    const lastDeploymentTime = formatDeploymentTime(
      readOptionalEnv(
        "BUILD_TIMESTAMP",
        "DEPLOYMENT_TIMESTAMP",
        "VERCEL_DEPLOYMENT_CREATED_AT",
      ),
    );

    let apiBaseUrl: string | null = null;
    try {
      apiBaseUrl = resolveAdminApiBaseUrl();
    } catch {
      apiBaseUrl = null;
    }

    return {
      applicationVersion: applicationVersion || null,
      gitCommit,
      lastDeploymentTime,
      environment: resolveEnvironment(),
      apiBaseUrl,
      refreshedAt: new Date().toISOString(),
    };
  } catch {
    return {
      applicationVersion: null,
      gitCommit: null,
      lastDeploymentTime: null,
      environment: null,
      apiBaseUrl: null,
      refreshedAt: new Date().toISOString(),
    };
  }
}

export function displaySystemValue(value: string | null | undefined): string {
  if (!value || !value.trim()) return NOT_AVAILABLE_AR;
  return value.trim();
}
