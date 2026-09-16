"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
} from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { safeAuthRedirect } from "@/lib/auth-redirect";

type AuthScreenProps = {
  mode: "sign-in" | "sign-up";
};

// Marks a destination this page has already forwarded to. It rides along in the
// URL rather than in storage so the server and the browser agree on the first
// render, and so a bounce back here is self-describing.
const RETRY_PARAM = "auth_retry";

export function AuthScreen({ mode }: AuthScreenProps) {
  const isSignIn = mode === "sign-in";
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const fallbackUrl = isSignIn ? "/directory" : "/profile/edit";
  const redirectUrl = safeAuthRedirect(
    searchParams.get("redirect_url") ||
      searchParams.get("redirect_url_complete"),
    fallbackUrl,
    typeof window === "undefined" ? undefined : window.location.origin,
  );
  const alreadyForwarded = hasRetryMarker(redirectUrl);
  const stalled = isLoaded && isSignedIn && alreadyForwarded;
  const title = isSignIn ? "Loading Google sign in" : "Loading network join";
  const text = isSignIn
    ? "Setting up the secure Eureka 26 login."
    : "Setting up your secure Eureka 26 account.";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || alreadyForwarded) return;
    // The browser holds a session but this page rendered anyway, so the server
    // did not accept it. Forward once with a full navigation. If the visitor
    // lands back here the marker travels with them and we explain instead of
    // spinning forever.
    window.location.assign(withRetryMarker(redirectUrl));
  }, [isLoaded, isSignedIn, alreadyForwarded, redirectUrl]);

  return (
    <div className="auth-page">
      <ClerkLoading>
        <div className="auth-loading" role="status" aria-live="polite">
          <span className="live-dot" />
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        {stalled ? (
          <div className="auth-loading" role="alert">
            <h1>We cannot confirm your session</h1>
            <p>
              You are signed in on this device, but the server could not verify
              the session, so the network cannot open. This happens when the
              login provider is set up for a different address than the one you
              are on. Sign out and sign in again on the correct address.
            </p>
            <button
              className="button yellow small"
              onClick={() => void signOut({ redirectUrl: "/" })}
            >
              Sign out and start again
            </button>
          </div>
        ) : isSignedIn ? (
          <div className="auth-loading" role="status" aria-live="polite">
            <span className="live-dot" />
            <h1>Taking you in</h1>
            <p>Opening the Eureka 26 network now.</p>
          </div>
        ) : isSignIn ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={fallbackUrl}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={fallbackUrl}
          />
        )}
      </ClerkLoaded>
    </div>
  );
}

function hasRetryMarker(path: string) {
  return new RegExp(`[?&]${RETRY_PARAM}=1(&|#|$)`).test(path);
}

function withRetryMarker(path: string) {
  if (hasRetryMarker(path)) return path;
  const [beforeHash, hash] = splitHash(path);
  const separator = beforeHash.includes("?") ? "&" : "?";
  return `${beforeHash}${separator}${RETRY_PARAM}=1${hash}`;
}

function splitHash(path: string): [string, string] {
  const index = path.indexOf("#");
  return index === -1 ? [path, ""] : [path.slice(0, index), path.slice(index)];
}
