import "server-only";
import { headers } from "next/headers";

/** The origin the current request actually arrived on. */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return undefined;
  const proto =
    h.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
