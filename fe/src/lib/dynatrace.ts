/**
 * Client-side Dynatrace error reporter.
 * Sends errors to the internal Next.js API route which forwards them to
 * Dynatrace using the server-side token (never exposed to the browser).
 */

interface ErrorPayload {
  message: string;
  status_code?: number;
  path?: string;
  method?: string;
  extra?: Record<string, unknown>;
}

export function reportError(payload: ErrorPayload): void {
  // Fire-and-forget — never block the UI for logging
  fetch("/api/log-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // keepalive lets the request complete even if the page unloads
    keepalive: true,
  }).catch(() => {
    // Silently ignore logging failures
  });
}
