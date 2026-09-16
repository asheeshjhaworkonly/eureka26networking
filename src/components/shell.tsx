"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserButton,
  Show,
  SignInButton,
  SignUpButton,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import { ArrowUpRight, Sparkles } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Eureka 26 home">
      <span className="brand-mark">
        <Sparkles size={24} />
      </span>
      <span>
        EUREKA<span className="brand-year">26</span>
        <small>THE PARTICIPANT NETWORK</small>
      </span>
    </Link>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            <ClerkLoading>
              <Link className="nav-link" href="/sign-in">
                Sign in
              </Link>
              <Link className="button yellow small" href="/sign-up">
                Join the network <ArrowUpRight size={16} />
              </Link>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-in">
                <Link
                  className={
                    path === "/directory" ? "nav-link current" : "nav-link"
                  }
                  href="/directory"
                >
                  The directory
                </Link>
                <Link
                  className={
                    path === "/profile/edit" ? "nav-link current" : "nav-link"
                  }
                  href="/profile/edit"
                >
                  My profile <ArrowUpRight size={15} />
                </Link>
                <UserButton />
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="nav-link">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="button yellow small">
                    Join the network <ArrowUpRight size={16} />
                  </button>
                </SignUpButton>
              </Show>
            </ClerkLoaded>
          </nav>
        </div>
      </header>
      {children}
      <footer className="footer">
        <div>
          <strong>GOOD IDEAS. GREAT PEOPLE.</strong>
          <p>
            An unofficial Eureka 2026 participant initiative. Made by an
            anonymous participant.
          </p>
        </div>
        <Link href="/privacy">
          Privacy & community rules <ArrowUpRight size={16} />
        </Link>
      </footer>
    </>
  );
}
