/** Server-only secret for protected backend operational endpoints. */
export function resolveAdminApiSecret(): string | undefined {
  return (
    process.env.ADMIN_API_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    undefined
  );
}

export function adminBackendHeaders(): Record<string, string> {
  const secret = resolveAdminApiSecret();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (secret) {
    headers["X-Admin-Secret"] = secret;
  }
  return headers;
}
