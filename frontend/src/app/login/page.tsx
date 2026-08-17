"use client";

import { Suspense } from "react";
import { UserLoginPage } from "@/components/UserLoginPage";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthUser, getAuthUser, isAuthenticated } from "@/utils/authStore";
import { useEffect } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const modeParam = searchParams.get("mode") === "register" ? "register" : "login";

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getAuthUser();
      if (redirectParam) {
        router.replace(decodeURIComponent(redirectParam));
      } else if (user?.role === "Admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/Dashboard");
      }
    }
  }, [router, redirectParam]);

  const handleLoginSuccess = (user: AuthUser) => {
    if (redirectParam) {
      router.push(decodeURIComponent(redirectParam));
      return;
    }
    if (user.role === "Admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/Dashboard");
    }
  };

  return (
    <UserLoginPage
      initialMode={modeParam}
      onUserLoginSuccess={handleLoginSuccess}
      onGoToAdminLogin={() => router.push("/admin/login")}
    />
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-xs text-gray-500">
          Loading login...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
