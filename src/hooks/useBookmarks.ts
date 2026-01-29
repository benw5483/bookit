"use client";

import { useState, useEffect, useCallback } from "react";
import type { Bookmark, Category } from "@/db/schema";

type BookmarkWithCategory = Bookmark & { category: Category | null };

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/bookmarks");
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      const data = await response.json();
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const createBookmark = useCallback(
    async (data: Partial<Bookmark>) => {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create bookmark");
      await fetchBookmarks();
    },
    [fetchBookmarks]
  );

  const updateBookmark = useCallback(
    async (id: number, data: Partial<Bookmark>) => {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update bookmark");
      await fetchBookmarks();
    },
    [fetchBookmarks]
  );

  const deleteBookmark = useCallback(
    async (id: number) => {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete bookmark");
      await fetchBookmarks();
    },
    [fetchBookmarks]
  );

  return {
    bookmarks,
    loading,
    error,
    refetch: fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
  };
}
