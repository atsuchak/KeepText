"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Lock, Eye, EyeOff, LogOut, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { updateProfile, changePassword, logoutAllDevices, deleteAllNotes, deleteAccount, getProfile } from "@/actions/profile";

export default function ProfilePage() {
  const router = useRouter();
  
  // Basic Info State
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => Promise<void>) | null;
    type: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
    type: "warning"
  });

  useEffect(() => {
    async function loadProfile() {
      const res = await getProfile();
      if (res.error) {
        if (res.error === "Unauthorized") {
          router.push("/auth");
        } else {
          setMessage({ type: "error", text: res.error });
        }
      } else if (res.data) {
        setName(res.data.name);
        setMobileNumber(res.data.mobileNumber);
        setEmail(res.data.email);
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("profile");
    const res = await updateProfile(name, mobileNumber);
    if (res.error) {
      showMessage("error", res.error);
    } else {
      showMessage("success", "Profile updated successfully");
    }
    setActionLoading(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("password");
    const res = await changePassword(currentPassword, newPassword);
    if (res.error) {
      showMessage("error", res.error);
    } else {
      showMessage("success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    }
    setActionLoading(null);
  };

  const handleLogoutAll = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Logout All Devices",
      message: "Are you sure you want to log out from all devices?",
      type: "warning",
      action: async () => {
        setActionLoading("logoutAll");
        const res = await logoutAllDevices();
        if (res.error) {
          showMessage("error", res.error);
          setActionLoading(null);
        } else {
          router.push("/auth");
        }
      }
    });
  };

  const handleDeleteNotes = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete All Notes",
      message: "Are you sure you want to delete all saved notes? This cannot be undone.",
      type: "danger",
      action: async () => {
        setActionLoading("deleteNotes");
        const res = await deleteAllNotes();
        if (res.error) {
          showMessage("error", res.error);
        } else {
          localStorage.removeItem("blanked_note_content");
          showMessage("success", "All notes deleted successfully");
        }
        setActionLoading(null);
      }
    });
  };

  const handleDeleteAccount = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Account",
      message: "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.",
      type: "danger",
      action: async () => {
        setActionLoading("deleteAccount");
        const res = await deleteAccount();
        if (res.error) {
          showMessage("error", res.error);
          setActionLoading(null);
        } else {
          localStorage.removeItem("blanked_note_content");
          router.push("/auth");
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] pt-28 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center sm:text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your profile, security, and account preferences.</p>
        </div>

        {/* Global Message Alert */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-1">
          
          {/* Basic Section */}
          <section className="bg-white dark:bg-[#0B1120]/80 dark:backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Mobile Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-500 dark:text-gray-400">Email Address (Cannot be changed)</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading === "profile"}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading === "profile" && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Security Section */}
          <section className="bg-white dark:bg-[#0B1120]/80 dark:backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
                <button
                  type="button"
                  onClick={() => router.push("/auth?mode=forgot")}
                  className="text-sm font-medium text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition-colors text-left"
                >
                  Forgot Password?
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Current Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading === "password"}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading === "password" && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Activity Section */}
          <section className="bg-white dark:bg-[#0B1120]/80 dark:backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Activity & Danger Zone</h2>
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Log out from all devices across all browsers.</p>
                  </div>
                  <button
                    onClick={handleLogoutAll}
                    disabled={actionLoading === "logoutAll"}
                    className="px-4 py-2 sm:w-auto w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {actionLoading === "logoutAll" ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Logout All Devices
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-100 dark:border-red-500/10 bg-red-50/50 dark:bg-red-500/5">
                  <div>
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-200">Delete Notes</h3>
                    <p className="text-sm text-red-700 dark:text-red-400">Permanently remove all your saved notes.</p>
                  </div>
                  <button
                    onClick={handleDeleteNotes}
                    disabled={actionLoading === "deleteNotes"}
                    className="px-4 py-2 sm:w-auto w-full bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {actionLoading === "deleteNotes" ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Notes
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
                  <div>
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-200">Delete Account</h3>
                    <p className="text-sm text-red-700 dark:text-red-400">Permanently delete your account and all data.</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={actionLoading === "deleteAccount"}
                    className="px-4 py-2 sm:w-auto w-full bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {actionLoading === "deleteAccount" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Account
                  </button>
                </div>

              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {confirmDialog.title}
              </h3>
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (confirmDialog.action) {
                    await confirmDialog.action();
                  }
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  confirmDialog.type === "danger" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
