import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "Eureka 26 · Meet your next connection",
  description:
    "An unofficial participant network for Eureka 2026 zonals. Find people, discover ideas, and stay connected.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          dynamic
          appearance={{
            variables: {
              colorPrimary: "#171713",
              colorBackground: "#fffdf7",
              borderRadius: "0",
              fontFamily: "DM Sans, Arial, sans-serif",
            },
            elements: {
              cardBox: {
                boxShadow: "5px 5px 0 #171713",
                border: "2px solid #171713",
              },
              formButtonPrimary: {
                backgroundColor: "#f9e64e",
                color: "#171713",
                border: "2px solid #171713",
              },
            },
          }}
        >
          <Shell>{children}</Shell>
        </ClerkProvider>
      </body>
    </html>
  );
}
