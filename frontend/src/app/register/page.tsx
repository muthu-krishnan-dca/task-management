"use client";

import { Suspense } from "react";
import { UserLoginPage } from "@/components/UserLoginPage";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthUser, isAuthenticated } from "@/utils/authStore";
import { useEffect } from "react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (isAuthenticated()) {
      const target = redirectParam ? decodeURIComponent(redirectParam) : "/Dashboard";
      router.replace(target);
    }
  }, [router, redirectParam]);

  const handleRegisterSuccess = (user: AuthUser) => {
    const target = redirectParam ? decodeURIComponent(redirectParam) : "/Dashboard";
    router.push(target);
  };

  return (
    <UserLoginPage
      initialMode="register"
      onUserLoginSuccess={handleRegisterSuccess}
      onGoToAdminLogin={() => router.push("/admin/login")}
    />
  );
}

export default function RegisterPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-xs text-gray-500">
          Loading register...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
