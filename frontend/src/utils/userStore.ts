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
    const userRaw = localStorage.getItem("user");
    const raw = localStorage.getItem("userProfile");

    let parsed: any = {};
    if (userRaw) {
      try {
        parsed = { ...JSON.parse(userRaw), ...parsed };
      } catch {}
    }
    if (raw) {
      try {
        parsed = { ...parsed, ...JSON.parse(raw) };
      } catch {}
    }

    const cleanEmail = (parsed.email || DEFAULT_USER.email).toLowerCase().trim();
    const storedEmailAvatar = cleanEmail ? localStorage.getItem(`userAvatar_${cleanEmail}`) : null;
    const globalAvatar = localStorage.getItem("userAvatar");
    const avatarUrl = parsed.avatarUrl || storedEmailAvatar || globalAvatar || "";

    return {
      name: parsed.name || DEFAULT_USER.name,
      email: parsed.email || DEFAULT_USER.email,
      role: parsed.role || DEFAULT_USER.role,
      phone: parsed.phone || DEFAULT_USER.phone,
      avatarUrl,
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

  const cleanEmail = (updated.email || "").toLowerCase().trim();

  // Save current profile
  localStorage.setItem("userProfile", JSON.stringify(updated));

  // Save email-scoped profile and avatar for persistence across logouts
  if (cleanEmail) {
    localStorage.setItem(`userProfile_${cleanEmail}`, JSON.stringify(updated));
    if (updated.avatarUrl !== undefined) {
      localStorage.setItem(`userAvatar_${cleanEmail}`, updated.avatarUrl);
    }
  }

  if (updated.avatarUrl !== undefined) {
    localStorage.setItem("userAvatar", updated.avatarUrl);
  }

  // Also sync to active "user" key in localStorage
  try {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const activeUser = JSON.parse(userRaw);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...activeUser,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          avatarUrl: updated.avatarUrl,
        })
      );
    }
  } catch {}

  window.dispatchEvent(new Event("userProfileUpdated"));
  window.dispatchEvent(new Event("authChanged"));
  return updated;
}
