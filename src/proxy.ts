import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { signInDestination } from "@/lib/auth-redirect";

const isProtected = createRouteMatcher([
  "/directory(.*)",
  "/profile(.*)",
  "/p/(.*)",
  "/download(.*)",
]);

// Clerk's frontend API proxy exists for production instances, which serve the
// frontend API from a domain you control. Development instances reach Clerk
// directly, so deriving this from the key in use keeps the two from drifting.
const usesFrontendApiProxy = (
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""
).startsWith("pk_live_");

export default clerkMiddleware(
  async (auth, req) => {
    if (!isProtected(req)) return;
    const { isAuthenticated } = await auth();
    if (isAuthenticated) return;
    // Send the visitor to this app's own sign-in page. Letting Clerk decide
    // would hand them its account portal, which is unreachable whenever the
    // instance domain is not one the deployment actually serves, and the
    // request would be rewritten to a 404 instead of offering a way to sign in.
    const target = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(new URL(signInDestination(target), req.url));
  },
  usesFrontendApiProxy ? { frontendApiProxy: { enabled: true } } : undefined,
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
