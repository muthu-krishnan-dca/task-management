"use client";

import { AdminLoginPage } from "@/components/AdminLoginPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthUser, getAuthUser, isAuthenticated, setSession } from "@/utils/authStore";

export default function AdminLoginPageWrapper() {
  const router = useRouter();

  // Session check: if already logged in as Admin, redirect to /admin/dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getAuthUser();
      if (user?.role === "Admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/Dashboard");
      }
    }
  }, [router]);

  const handleAdminSuccess = (admin: AuthUser) => {
    setSession(admin, true);
    router.push("/admin/dashboard");
  };

  return (
    <AdminLoginPage
      onAdminLoginSuccess={handleAdminSuccess}
      onGoToUserLogin={() => router.push("/login")}
    />
  );
}
