"use client";

import { UserLoginPage } from "@/components/UserLoginPage";
import { useRouter } from "next/navigation";

export default function UserLoginPageWrapper() {
  const router = useRouter();

  const handleUserSuccess = (user: { name: string; role: "User"; email: string }) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    router.push("/");
  };

  return (
    <UserLoginPage
      onUserLoginSuccess={handleUserSuccess}
      onGoToAdminLogin={() => router.push("/")}
    />
  );
}
