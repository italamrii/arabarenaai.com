const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export function checkAdminLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetAdminLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}
