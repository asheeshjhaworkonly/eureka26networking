"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";

type AuthScreenProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const isSignIn = mode === "sign-in";
  const title = isSignIn ? "Loading Google sign in" : "Loading network join";
  const text = isSignIn
    ? "Setting up the secure Eureka 26 login."
    : "Setting up your secure Eureka 26 account.";

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
        {isSignIn ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/directory"
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/profile/edit"
          />
        )}
      </ClerkLoaded>
    </div>
  );
}
