"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getAuthUser, AuthUser } from "@/utils/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const currentUser = getAuthUser();

      if (!authenticated || !currentUser) {
        // Redirect unauthenticated user to login with return path
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.replace(redirectUrl);
        return;
      }

      // Check role permissions if specified
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = currentUser.role || "User";
        const hasRole = allowedRoles.some(
          (role) => role.toLowerCase() === userRole.toLowerCase()
        );

        if (!hasRole) {
          router.replace("/Dashboard");
          return;
        }
      }

      setUser(currentUser);
      setIsChecking(false);
    };

    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener("authChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, [router, pathname, allowedRoles]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute h-12 w-12 rounded-full border-3 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
          <div className="h-6 w-6 rounded-lg bg-black dark:bg-indigo-600 text-xs font-black text-white flex items-center justify-center shadow-xs">
            A
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
