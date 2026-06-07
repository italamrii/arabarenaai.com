const SESSION_KEY = "ab_session_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(sessionId: string): boolean {
  return UUID_RE.test(sessionId);
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function clearSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function ensureSessionId(): string | null {
  const sessionId = getSessionId();
  if (sessionId && isValidSessionId(sessionId)) {
    return sessionId;
  }
  return null;
}
