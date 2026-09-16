import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth-screen";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { requestOrigin } from "@/lib/request-origin";

type AuthPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: AuthPageProps) {
  const { isAuthenticated } = await auth();
  const params = await searchParams;

  if (isAuthenticated) {
    redirect(
      safeAuthRedirect(
        firstParam(params?.redirect_url) ??
          firstParam(params?.redirect_url_complete),
        "/directory",
        await requestOrigin(),
      ),
    );
  }

  return <AuthScreen mode="sign-in" />;
}
