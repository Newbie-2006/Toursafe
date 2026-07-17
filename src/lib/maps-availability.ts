/**
 * Google Maps Platform (Places / Directions) availability latch.
 *
 * Basic map tiles work with just a key, but Places + Directions additionally
 * require BILLING to be enabled on the Google Cloud project. When it isn't,
 * every request fails with REQUEST_DENIED and Google's SDK logs a console
 * error — so naive retries flood the dev overlay with dozens of "issues".
 *
 * This latch remembers the first denial (per tab, with a short TTL) so the
 * app silently falls back to built-in data instead of hammering a service
 * that cannot succeed. The TTL means that once the user enables billing,
 * full functionality returns by itself within ~2 minutes — no reload needed.
 */

const KEY = "toursafe.gmp-denied.v1";
const RETRY_AFTER_MS = 2 * 60 * 1000;

let deniedUntil = 0; // in-memory mirror; survives re-renders, not reloads

function readStored(): number {
  try {
    return Number(window.sessionStorage.getItem(KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** True while Places/Directions calls are known to be futile (billing off). */
export function isGmpDenied(): boolean {
  if (typeof window === "undefined") return true;
  const until = Math.max(deniedUntil, readStored());
  return Date.now() < until;
}

/** Record a REQUEST_DENIED / billing failure; suppresses calls for the TTL. */
export function markGmpDenied(): void {
  deniedUntil = Date.now() + RETRY_AFTER_MS;
  try {
    window.sessionStorage.setItem(KEY, String(deniedUntil));
  } catch {
    /* ignore */
  }
}
