export const CANONICAL_ORIGIN = "https://eureka26network.vercel.app";

export function safeAuthRedirect(
  value: string | null | undefined,
  fallbackUrl: string,
  origin = CANONICAL_ORIGIN,
) {
  if (!value) return fallbackUrl;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return fallbackUrl;
    return `${url.pathname}${url.search}${url.hash}` || fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}
