"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { CommandLineIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { Bookmark, Category } from "@/db/schema";

type BookmarkWithCategory = Bookmark & { category: Category | null };

interface ShortcutCommandBarProps {
  isOpen: boolean;
  sequence: string;
  matchedBookmark: BookmarkWithCategory | null;
  potentialMatches: BookmarkWithCategory[];
}

export function ShortcutCommandBar({
  isOpen,
  sequence,
  matchedBookmark,
  potentialMatches,
}: ShortcutCommandBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden w-[calc(100vw-4rem)] sm:w-[400px] md:w-[360px] lg:w-[380px]">
            {/* Input display */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                {matchedBookmark ? (
                  <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <CommandLineIcon className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  {sequence.split("").map((char, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center justify-center w-7 h-8 rounded font-mono text-sm font-semibold ${
                        matchedBookmark
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-slate-700/50 text-white border border-slate-600/50"
                      }`}
                    >
                      {char}
                    </span>
                  ))}
                  {!matchedBookmark && (
                    <span className="w-0.5 h-6 bg-indigo-500 animate-pulse ml-1" />
                  )}
                </div>
              </div>
            </div>

            {/* Matched bookmark */}
            {matchedBookmark && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  {matchedBookmark.favicon && (
                    <img
                      src={matchedBookmark.favicon}
                      alt=""
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <span className="text-sm text-green-400 font-medium">
                    Opening {matchedBookmark.name}...
                  </span>
                </div>
              </div>
            )}

            {/* Potential matches */}
            {!matchedBookmark && potentialMatches.length > 0 && (
              <div className="border-t border-slate-700/50 px-3 py-2 max-h-48 overflow-auto">
                <p className="text-xs text-slate-500 px-2 pb-2">
                  Matching shortcuts
                </p>
                {potentialMatches.slice(0, 5).map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm"
                  >
                    {bookmark.favicon ? (
                      <img
                        src={bookmark.favicon}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-slate-700 rounded" />
                    )}
                    <span className="text-slate-400 truncate flex-1">
                      {bookmark.name}
                    </span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                      {bookmark.keyboardShortcut}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Help text */}
            {!matchedBookmark && (
              <div className="px-5 pb-3 pt-1">
                <p className="text-xs text-slate-500">
                  <span className="text-slate-400">⌫</span> delete •{" "}
                  <span className="text-slate-400">esc</span> close
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
