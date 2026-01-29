"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import type { Bookmark, Category } from "@/db/schema";

type BookmarkWithCategory = Bookmark & { category: Category | null };

interface ShortcutState {
  isOpen: boolean;
  sequence: string;
  exactMatch: BookmarkWithCategory | null;
  hasLongerMatches: boolean;
  activatedBookmark: BookmarkWithCategory | null;
}

export function useKeyboardShortcuts(bookmarks: BookmarkWithCategory[]) {
  const [state, setState] = useState<ShortcutState>({
    isOpen: false,
    sequence: "",
    exactMatch: null,
    hasLongerMatches: false,
    activatedBookmark: null,
  });

  const activatingRef = useRef(false);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      sequence: "",
      exactMatch: null,
      hasLongerMatches: false,
      activatedBookmark: null,
    });
  }, []);

  const activateBookmark = useCallback(
    (bookmark: BookmarkWithCategory) => {
      if (activatingRef.current) return;
      activatingRef.current = true;

      setState((prev) => ({ ...prev, activatedBookmark: bookmark }));

      // Small delay to show the activation, then open URL and close
      setTimeout(() => {
        window.open(bookmark.url, "_blank", "noopener,noreferrer");
        close();
        activatingRef.current = false;
      }, 150);
    },
    [close]
  );

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

      // Handle Enter - activate exact match if available
      if (event.key === "Enter") {
        if (state.isOpen && state.exactMatch && !state.activatedBookmark) {
          event.preventDefault();
          activateBookmark(state.exactMatch);
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
            // Recalculate matches for the new sequence
            const exactMatch = bookmarks.find(
              (b) =>
                b.keyboardShortcut &&
                b.keyboardShortcut.toLowerCase() === newSequence
            ) || null;

            const hasLongerMatches = bookmarks.some(
              (b) =>
                b.keyboardShortcut &&
                b.keyboardShortcut.toLowerCase().startsWith(newSequence) &&
                b.keyboardShortcut.toLowerCase() !== newSequence
            );

            setState((prev) => ({
              ...prev,
              sequence: newSequence,
              exactMatch,
              hasLongerMatches,
              activatedBookmark: null,
            }));
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

      // Don't process if we're currently activating
      if (state.activatedBookmark) return;

      event.preventDefault();

      // Add the key to the sequence
      const newSequence = state.sequence + event.key.toLowerCase();

      // Find exact match
      const exactMatch = bookmarks.find(
        (b) =>
          b.keyboardShortcut &&
          b.keyboardShortcut.toLowerCase() === newSequence
      ) || null;

      // Check if there are longer shortcuts that start with this sequence
      const hasLongerMatches = bookmarks.some(
        (b) =>
          b.keyboardShortcut &&
          b.keyboardShortcut.toLowerCase().startsWith(newSequence) &&
          b.keyboardShortcut.toLowerCase() !== newSequence
      );

      // If exact match with no longer matches, auto-activate
      if (exactMatch && !hasLongerMatches) {
        setState({
          isOpen: true,
          sequence: newSequence,
          exactMatch,
          hasLongerMatches: false,
          activatedBookmark: null,
        });
        activateBookmark(exactMatch);
      } else {
        // Update state - user may need to press Enter or continue typing
        setState({
          isOpen: true,
          sequence: newSequence,
          exactMatch,
          hasLongerMatches,
          activatedBookmark: null,
        });
      }
    },
    [bookmarks, state.isOpen, state.sequence, state.exactMatch, state.activatedBookmark, close, activateBookmark]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Find potential matches (shortcuts that start with current sequence but aren't exact)
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
    exactMatch: state.exactMatch,
    hasLongerMatches: state.hasLongerMatches,
    activatedBookmark: state.activatedBookmark,
    potentialMatches,
    close,
  };
}
