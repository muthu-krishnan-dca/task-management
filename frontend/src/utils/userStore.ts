export interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
}

export const DEFAULT_USER: UserProfile = {
  name: "Muthu M",
  email: "muthu@taskflow.io",
  role: "Administrator",
  phone: "+91 98765 43210",
  avatarUrl: "",
};

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem("userProfile");
    if (!raw) {
      // Check legacy "user" key if present
      const legacy = localStorage.getItem("user");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return {
          name: parsed.name || DEFAULT_USER.name,
          email: parsed.email || DEFAULT_USER.email,
          role: parsed.role || DEFAULT_USER.role,
          phone: parsed.phone || DEFAULT_USER.phone,
          avatarUrl: localStorage.getItem("userAvatar") || "",
        };
      }
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || DEFAULT_USER.name,
      email: parsed.email || DEFAULT_USER.email,
      role: parsed.role || DEFAULT_USER.role,
      phone: parsed.phone || DEFAULT_USER.phone,
      avatarUrl: parsed.avatarUrl || localStorage.getItem("userAvatar") || "",
    };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER;
  const current = getUserProfile();
  const updated: UserProfile = {
    ...current,
    ...profile,
  };
  localStorage.setItem("userProfile", JSON.stringify(updated));
  if (profile.avatarUrl !== undefined) {
    localStorage.setItem("userAvatar", profile.avatarUrl);
  }
  window.dispatchEvent(new Event("userProfileUpdated"));
  return updated;
}
