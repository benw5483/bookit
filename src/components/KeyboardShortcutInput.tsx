"use client";

import { cn } from "@/lib/utils";

interface KeyboardShortcutInputProps {
  value: string | null;
  onChange: (shortcut: string | null) => void;
  className?: string;
}

export function KeyboardShortcutInput({
  value,
  onChange,
  className,
}: KeyboardShortcutInputProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Keyboard Shortcut
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="e.g., goo, gh, yt"
        maxLength={10}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 font-mono",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
          "transition-all duration-200",
          className
        )}
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Type this sequence anywhere in the app to open this bookmark (case-insensitive)
      </p>
    </div>
  );
}
