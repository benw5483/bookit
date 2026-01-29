"use client";

import { useEffect, useCallback, useState } from "react";
import type { Bookmark, Category } from "@/db/schema";

type BookmarkWithCategory = Bookmark & { category: Category | null };

interface ShortcutState {
  isOpen: boolean;
  sequence: string;
  matchedBookmark: BookmarkWithCategory | null;
}

export function useKeyboardShortcuts(bookmarks: BookmarkWithCategory[]) {
  const [state, setState] = useState<ShortcutState>({
    isOpen: false,
    sequence: "",
    matchedBookmark: null,
  });

  const close = useCallback(() => {
    setState({ isOpen: false, sequence: "", matchedBookmark: null });
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

      // Handle Escape - close the command bar
      if (event.key === "Escape") {
        if (state.isOpen) {
          event.preventDefault();
          close();
        }
        return;
      }

      // Handle Backspace - delete last character
      if (event.key === "Backspace") {
        if (state.isOpen) {
          event.preventDefault();
          const newSequence = state.sequence.slice(0, -1);
          if (newSequence.length === 0) {
            close();
          } else {
            setState((prev) => ({ ...prev, sequence: newSequence }));
          }
        }
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

      event.preventDefault();

      // Add the key to the sequence
      const newSequence = state.sequence + event.key.toLowerCase();

      // Check if current sequence matches any bookmark shortcut
      let matchedBookmark: BookmarkWithCategory | null = null;

      for (const bookmark of bookmarks) {
        if (!bookmark.keyboardShortcut) continue;

        const shortcut = bookmark.keyboardShortcut.toLowerCase();

        // Exact match - open the bookmark
        if (shortcut === newSequence) {
          matchedBookmark = bookmark;
          break;
        }
      }

      if (matchedBookmark) {
        // Show the match briefly, then open and close
        setState({ isOpen: true, sequence: newSequence, matchedBookmark });

        // Small delay to show the match, then open URL and close
        setTimeout(() => {
          window.open(matchedBookmark!.url, "_blank", "noopener,noreferrer");
          close();
        }, 150);
      } else {
        // Update state with new sequence
        setState({
          isOpen: true,
          sequence: newSequence,
          matchedBookmark: null,
        });
      }
    },
    [bookmarks, state.isOpen, state.sequence, close]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Find potential matches (shortcuts that start with current sequence)
  const potentialMatches = state.sequence
    ? bookmarks.filter(
        (b) =>
          b.keyboardShortcut &&
          b.keyboardShortcut.toLowerCase().startsWith(state.sequence) &&
          b.keyboardShortcut.toLowerCase() !== state.sequence
      )
    : [];

  return {
    isOpen: state.isOpen,
    sequence: state.sequence,
    matchedBookmark: state.matchedBookmark,
    potentialMatches,
    close,
  };
}
