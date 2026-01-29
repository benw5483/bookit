"use client";

import { useEffect, useCallback, useRef } from "react";
import type { Bookmark, Category } from "@/db/schema";

type BookmarkWithCategory = Bookmark & { category: Category | null };

const SEQUENCE_TIMEOUT = 1000; // Reset sequence after 1 second of inactivity

export function useKeyboardShortcuts(bookmarks: BookmarkWithCategory[]) {
  const sequenceRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetSequence = useCallback(() => {
    sequenceRef.current = "";
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore modifier keys and special keys
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.key.length !== 1
      ) {
        return;
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add the key to the sequence
      sequenceRef.current += event.key.toLowerCase();

      // Set timeout to reset sequence
      timeoutRef.current = setTimeout(resetSequence, SEQUENCE_TIMEOUT);

      // Check if current sequence matches any bookmark shortcut
      const currentSequence = sequenceRef.current;

      for (const bookmark of bookmarks) {
        if (!bookmark.keyboardShortcut) continue;

        const shortcut = bookmark.keyboardShortcut.toLowerCase();

        // Exact match - open the bookmark
        if (shortcut === currentSequence) {
          event.preventDefault();
          window.open(bookmark.url, "_blank", "noopener,noreferrer");
          resetSequence();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          return;
        }
      }
    },
    [bookmarks, resetSequence]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyDown]);
}
