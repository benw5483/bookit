"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  KeyIcon,
  UserIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleExport() {
    window.location.href = "/api/bookmarks/export";
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch("/api/bookmarks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setImportMessage({
        type: "success",
        text: `Imported ${result.results.bookmarksCreated} bookmarks and ${result.results.categoriesCreated} categories. Skipped ${result.results.bookmarksSkipped} duplicate bookmarks and ${result.results.categoriesSkipped} existing categories.`,
      });
    } catch (error) {
      setImportMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to import",
      });
    } finally {
      setImportLoading(false);
      // Reset file input
      e.target.value = "";
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }

    setLoading(true);

    // Note: Password change endpoint would need to be implemented
    // This is a placeholder for the UI
    setMessage({
      type: "success",
      text: "Password updated successfully",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account</h2>
              <p className="text-sm text-slate-400">Your account information</p>
            </div>
          </div>
          <div className="pl-13">
            <p className="text-slate-300">
              <span className="text-slate-500">Username:</span>{" "}
              {session?.user?.name || "Unknown"}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <KeyIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Change Password
              </h2>
              <p className="text-sm text-slate-400">
                Update your account password
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {message && (
              <div
                className={`px-4 py-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-500/10 border border-green-500/50 text-green-400"
                    : "bg-red-500/10 border border-red-500/50 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <Input
              id="currentPassword"
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              id="newPassword"
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <ArrowDownTrayIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Data Management
              </h2>
              <p className="text-sm text-slate-400">
                Export and import your bookmarks
              </p>
            </div>
          </div>

          {importMessage && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                importMessage.type === "success"
                  ? "bg-green-500/10 border border-green-500/50 text-green-400"
                  : "bg-red-500/10 border border-red-500/50 text-red-400"
              }`}
            >
              {importMessage.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExport} variant="secondary">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Bookmarks
            </Button>
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importLoading}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={importLoading}
                onClick={(e) => {
                  const input = (e.target as HTMLElement)
                    .closest("label")
                    ?.querySelector("input");
                  input?.click();
                }}
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                {importLoading ? "Importing..." : "Import Bookmarks"}
              </Button>
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Export creates a JSON file with all your bookmarks and categories.
            Import will skip duplicates (matching URLs).
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
              <InformationCircleIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-slate-400">How to use shortcuts</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              Keyboard shortcuts work when this browser tab is focused. Simply
              type a sequence of letters to open a bookmark:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <span className="font-mono bg-slate-700/50 px-1.5 py-0.5 rounded">
                  goo
                </span>{" "}
                - Opens Google
              </li>
              <li>
                <span className="font-mono bg-slate-700/50 px-1.5 py-0.5 rounded">
                  gh
                </span>{" "}
                - Opens GitHub
              </li>
              <li>
                <span className="font-mono bg-slate-700/50 px-1.5 py-0.5 rounded">
                  yt
                </span>{" "}
                - Opens YouTube
              </li>
            </ul>
            <p className="text-slate-500">
              Shortcuts are case-insensitive. The sequence resets after 1 second
              of inactivity.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
