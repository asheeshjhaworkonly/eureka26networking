const FALLBACK_ORIGIN = "http://localhost";

/**
 * Reduce a post-authentication destination to a same-origin path.
 *
 * Absolute destinations are accepted only when they match the origin the
 * request actually arrived on, so the app is never pinned to one hostname and
 * never forwards a visitor to another site. Anything else falls back.
 */
export function safeAuthRedirect(
  value: string | null | undefined,
  fallbackUrl: string,
  origin?: string | null,
) {
  if (!value) return fallbackUrl;
  const base = origin || FALLBACK_ORIGIN;
  try {
    const url = new URL(value, base);
    if (url.origin !== new URL(base).origin) return fallbackUrl;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("/") ? path : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

/** Build the app's own sign-in destination for a protected request. */
export function signInDestination(
  pathWithQuery: string,
  signInPath = "/sign-in",
) {
  if (!pathWithQuery.startsWith("/")) return signInPath;
  if (
    pathWithQuery === signInPath ||
    pathWithQuery.startsWith(`${signInPath}?`)
  )
    return signInPath;
  return `${signInPath}?redirect_url=${encodeURIComponent(pathWithQuery)}`;
}
