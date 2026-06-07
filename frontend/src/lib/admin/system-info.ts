import packageJson from "../../../package.json";

export interface SystemOverview {
  applicationVersion: string | null;
  gitCommit: string | null;
  lastDeploymentTime: string | null;
  environment: string | null;
}

const NOT_AVAILABLE = "Not Available";

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

export function loadSystemOverview(backendVersion: string | null | undefined): SystemOverview {
  try {
    const applicationVersion =
      (backendVersion && backendVersion.trim()) ||
      (typeof packageJson.version === "string" ? packageJson.version : null);

    const gitCommit = formatGitCommit(
      readOptionalEnv("VERCEL_GIT_COMMIT_SHA", "GIT_COMMIT", "COMMIT_SHA"),
    );

    const lastDeploymentTime = readOptionalEnv(
      "BUILD_TIMESTAMP",
      "DEPLOYMENT_TIMESTAMP",
      "VERCEL_DEPLOYMENT_CREATED_AT",
    );

    return {
      applicationVersion: applicationVersion || null,
      gitCommit,
      lastDeploymentTime,
      environment: resolveEnvironment(),
    };
  } catch {
    return {
      applicationVersion: null,
      gitCommit: null,
      lastDeploymentTime: null,
      environment: null,
    };
  }
}

export function displaySystemValue(value: string | null | undefined): string {
  if (!value || !value.trim()) return NOT_AVAILABLE;
  return value.trim();
}
