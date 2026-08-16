"use client";

import { AdminLoginPage } from "@/components/AdminLoginPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLoginPageWrapper() {
  const router = useRouter();

  // Session check: if already logged in as Admin, redirect to /admin/dashboard
  useEffect(() => {
    const savedSession = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("user");
    if (savedSession === "true" && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj.role === "Admin") {
          router.push("/admin/dashboard");
        }
      } catch {
        // Fallback
      }
    }
  }, [router]);

  const handleAdminSuccess = (admin: { name: string; role: "Admin"; email: string }) => {
    localStorage.setItem("user", JSON.stringify(admin));
    localStorage.setItem("isLoggedIn", "true");
    router.push("/admin/dashboard");
  };

  return (
    <AdminLoginPage
      onAdminLoginSuccess={handleAdminSuccess}
      onGoToUserLogin={() => router.push("/")}
    />
  );
}
