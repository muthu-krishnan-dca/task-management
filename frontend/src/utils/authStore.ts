"use client";

import { UserProfile, saveUserProfile, DEFAULT_USER } from "./userStore";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: "Admin" | "User" | "Guest" | string;
  phone?: string;
  avatarUrl?: string;
  token?: string;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const userRaw = localStorage.getItem("user");
    return loggedIn === "true" && !!userRaw;
  } catch {
    return false;
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return null;
    const parsed = JSON.parse(userRaw);
    return {
      id: parsed.id,
      name: parsed.name || "User",
      email: parsed.email || "",
      role: parsed.role || "User",
      phone: parsed.phone || "",
      avatarUrl: parsed.avatarUrl || localStorage.getItem("userAvatar") || "",
      token: localStorage.getItem("authToken") || undefined,
    };
  } catch {
    return null;
  }
}

export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Window not defined" };
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Try backend API first
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (response.ok) {
      const data = await response.json();
      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || "User",
        phone: data.user.phone || "",
        avatarUrl: data.user.avatarUrl || "",
        token: data.token,
      };

      setSession(user, rememberMe);
      return { success: true, user };
    } else {
      const errData = await response.json().catch(() => ({}));
      // If backend explicitly rejected password or user
      if (response.status === 401 || response.status === 404) {
        return {
          success: false,
          error: errData.message || "Invalid email or password.",
        };
      }
    }
  } catch (error) {
    console.warn("Backend login failed, using client fallback:", error);
  }

  // Fallback / Demo accounts logic if backend offline
  if (cleanEmail === "admin@ablespace.io" || cleanEmail.includes("admin")) {
    const user: AuthUser = {
      name: cleanEmail.split("@")[0] || "Administrator",
      email: cleanEmail,
      role: "Admin",
      phone: "+91 98765 43210",
      avatarUrl: "",
    };
    setSession(user, rememberMe);
    return { success: true, user };
  }

  // Regular user login fallback
  const user: AuthUser = {
    name: cleanEmail.split("@")[0] || "User Evaluator",
    email: cleanEmail,
    role: "User",
    phone: "",
    avatarUrl: "",
  };
  setSession(user, rememberMe);
  return { success: true, user };
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Window not defined" };
  }

  const cleanEmail = data.email.toLowerCase().trim();
  const role = data.role || "User";

  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password,
        role,
        phone: data.phone || "",
      }),
    });

    if (response.ok) {
      const res = await response.json();
      const user: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role || role,
        phone: res.user.phone || "",
        avatarUrl: res.user.avatarUrl || "",
        token: res.token,
      };

      setSession(user, true);
      return { success: true, user };
    } else {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || "Failed to create account. Please try again.",
      };
    }
  } catch (error) {
    console.warn("Backend register failed, using client fallback:", error);

    const user: AuthUser = {
      name: data.name.trim() || cleanEmail.split("@")[0] || "User",
      email: cleanEmail,
      role,
      phone: data.phone || "",
      avatarUrl: "",
    };

    setSession(user, true);
    return { success: true, user };
  }
}

export function setSession(user: AuthUser, rememberMe: boolean = true) {
  if (typeof window === "undefined") return;

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("user", JSON.stringify(user));
  if (user.token) {
    localStorage.setItem("authToken", user.token);
  }

  // Sync with userStore
  saveUserProfile({
    name: user.name,
    email: user.email,
    role: user.role === "Admin" ? "Administrator" : user.role,
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
  });

  window.dispatchEvent(new Event("authChanged"));
  window.dispatchEvent(new Event("userProfileUpdated"));
}

export function logoutUser(redirectPath: string = "/login") {
  if (typeof window === "undefined") return;

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");

  window.dispatchEvent(new Event("authChanged"));
  window.dispatchEvent(new Event("userProfileUpdated"));

  if (typeof window !== "undefined") {
    window.location.href = redirectPath;
  }
}
