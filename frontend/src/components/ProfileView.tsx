"use client";

import { useEffect, useRef, useState } from "react";
import { getUserProfile, saveUserProfile, UserProfile } from "@/utils/userStore";

interface ProfileViewProps {
  currentUser?: { name: string; role: string; email: string };
  onUpdateUser?: (updated: { name: string; email: string }) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export function ProfileView({
  currentUser,
  onUpdateUser,
  onUpdateAvatar,
}: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [toastMsg, setToastMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3500);
  };

  const loadProfile = () => {
    const current = getUserProfile();
    setProfile(current);
    setName(current.name);
    setEmail(current.email);
    setPhone(current.phone || "");
    setAvatarUrl(current.avatarUrl || "");
  };

  useEffect(() => {
    loadProfile();

    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setAvatarUrl(base64Url);
        saveUserProfile({ avatarUrl: base64Url });
        onUpdateAvatar?.(base64Url);
        triggerToast("Profile picture updated! 📸");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUrl("");
    saveUserProfile({ avatarUrl: "" });
    onUpdateAvatar?.("");
    triggerToast("Profile picture removed! 🗑️");
  };

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Full Name cannot be empty.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated = saveUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });

    setProfile(updated);
    setIsEditing(false);
    onUpdateUser?.({ name: updated.name, email: updated.email });
    triggerToast("Profile updated successfully! ✨");
  };

  const userInitial = (profile.name || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 p-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-2xl animate-in slide-in-from-top-3 text-sm">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Profile</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your personal information, role, and workspace presence.
          </p>
        </div>

        {/* Profile Avatar & Role */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 font-bold text-white text-3xl shadow-lg overflow-hidden border-2 border-purple-200 dark:border-purple-900">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 shadow-md border border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 text-xs transition"
              title="Upload New Profile Picture"
            >
              📷
            </button>
          </div>

          {/* Photo Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              {avatarUrl ? "Change Photo" : "Upload Photo"}
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="rounded-lg bg-red-50 dark:bg-red-950/50 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition"
              >
                Remove
              </button>
            )}
          </div>

          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 px-3.5 py-0.5 text-xs font-bold">
            {profile.name}
          </span>
        </div>

        {/* Edit Form OR View Mode */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`w-full rounded-lg border px-3.5 py-2 text-xs font-medium outline-none transition ${
                  errors.name
                    ? "border-red-500 bg-red-50/30 dark:bg-red-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`w-full rounded-lg border px-3.5 py-2 text-xs font-medium outline-none transition ${
                  errors.email
                    ? "border-red-500 bg-red-50/30 dark:bg-red-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(profile.name);
                  setEmail(profile.email);
                  setPhone(profile.phone || "");
                  setErrors({});
                }}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-black dark:bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:hover:bg-indigo-500 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{profile.name}</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{profile.email}</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {profile.phone || "Not set"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Account Role</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{profile.role}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="w-full rounded-lg bg-black dark:bg-white px-4 py-2.5 text-xs font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-xs"
          >
            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>

      </div>
    </div>
  );
}
