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
  exactMatch: BookmarkWithCategory | null;
  hasLongerMatches: boolean;
  activatedBookmark: BookmarkWithCategory | null;
  potentialMatches: BookmarkWithCategory[];
}

export function ShortcutCommandBar({
  isOpen,
  sequence,
  exactMatch,
  hasLongerMatches,
  activatedBookmark,
  potentialMatches,
}: ShortcutCommandBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const showExactMatchReady = exactMatch && hasLongerMatches && !activatedBookmark;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] hidden md:block"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] hidden md:block"
          >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden w-[25vw] min-w-[400px]">
            {/* Input display */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0">
                {activatedBookmark ? (
                  <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <CommandLineIcon className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  {sequence.split("").map((char, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center justify-center w-7 h-8 rounded font-mono text-sm font-semibold ${
                        activatedBookmark
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : showExactMatchReady
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-700/50 text-white border border-slate-600/50"
                      }`}
                    >
                      {char}
                    </span>
                  ))}
                  {!activatedBookmark && (
                    <span className="w-0.5 h-6 bg-indigo-500 animate-pulse ml-1" />
                  )}
                </div>
              </div>
            </div>

            {/* Activated bookmark */}
            {activatedBookmark && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  {activatedBookmark.favicon && (
                    <img
                      src={activatedBookmark.favicon}
                      alt=""
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <span className="text-sm text-green-400 font-medium truncate">
                    Opening {activatedBookmark.name}...
                  </span>
                </div>
              </div>
            )}

            {/* Exact match ready (with longer alternatives) */}
            {showExactMatchReady && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  {exactMatch.favicon && (
                    <img
                      src={exactMatch.favicon}
                      alt=""
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <span className="text-sm text-amber-400 font-medium truncate flex-1">
                    {exactMatch.name}
                  </span>
                  <span className="text-xs text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded font-medium shrink-0">
                    ↵ enter
                  </span>
                </div>
              </div>
            )}

            {/* Potential matches */}
            {!activatedBookmark && potentialMatches.length > 0 && (
              <div className="border-t border-slate-700/50 px-3 py-2 max-h-48 overflow-auto">
                <p className="text-xs text-slate-500 px-2 pb-2">
                  {showExactMatchReady ? "Or continue typing..." : "Matching shortcuts"}
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
            {!activatedBookmark && (
              <div className="px-5 pb-3 pt-1">
                <p className="text-xs text-slate-500">
                  <span className="text-slate-400">⌫</span> delete •{" "}
                  <span className="text-slate-400">esc</span> close
                  {showExactMatchReady && (
                    <>
                      {" "}• <span className="text-slate-400">↵</span> open
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
