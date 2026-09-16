"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignUp,
  useAuth,
} from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CANONICAL_ORIGIN, safeAuthRedirect } from "@/lib/auth-redirect";

type AuthScreenProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const isSignIn = mode === "sign-in";
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackUrl = isSignIn ? "/directory" : "/profile/edit";
  const redirectUrl = safeAuthRedirect(
    searchParams.get("redirect_url") ||
      searchParams.get("redirect_url_complete"),
    fallbackUrl,
    currentOrigin(),
  );
  const title = isSignIn ? "Loading Google sign in" : "Loading network join";
  const text = isSignIn
    ? "Setting up the secure Eureka 26 login."
    : "Setting up your secure Eureka 26 account.";

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(redirectUrl);
  }, [isLoaded, isSignedIn, redirectUrl, router]);

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
        {isSignedIn ? (
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

function currentOrigin() {
  return typeof window === "undefined"
    ? CANONICAL_ORIGIN
    : window.location.origin;
}
