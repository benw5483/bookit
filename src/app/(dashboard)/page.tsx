"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { BookmarkCard } from "@/components/BookmarkCard";
import { BookmarkListItem } from "@/components/BookmarkListItem";
import { BookmarkForm, BookmarkFormData } from "@/components/BookmarkForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ShortcutCommandBar } from "@/components/ShortcutCommandBar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { Bookmark, Category } from "@/db/schema";

type BookmarkWithCategory = Bookmark & { category: Category | null };

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkWithCategory | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewType, setViewType] = useState<"cards" | "list">("cards");

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("bookit-view-type");
    if (savedView === "cards" || savedView === "list") {
      setViewType(savedView);
    }
  }, []);

  // Save view preference to localStorage
  function handleViewChange(view: "cards" | "list") {
    setViewType(view);
    localStorage.setItem("bookit-view-type", view);
  }

  // Enable keyboard shortcuts
  const shortcutState = useKeyboardShortcuts(bookmarks);

  const fetchData = useCallback(async () => {
    try {
      const [bookmarksRes, categoriesRes] = await Promise.all([
        fetch("/api/bookmarks"),
        fetch("/api/categories"),
      ]);
      const [bookmarksData, categoriesData] = await Promise.all([
        bookmarksRes.json(),
        categoriesRes.json(),
      ]);
      setBookmarks(bookmarksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === null || b.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  async function handleCreateOrUpdate(data: BookmarkFormData) {
    const method = editingBookmark ? "PUT" : "POST";
    const url = editingBookmark
      ? `/api/bookmarks/${editingBookmark.id}`
      : "/api/bookmarks";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to save bookmark");

    await fetchData();
    setEditingBookmark(null);
  }

  async function handleDelete() {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/bookmarks/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete bookmark");

      await fetchData();
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit(bookmark: BookmarkWithCategory) {
    setEditingBookmark(bookmark);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingBookmark(null);
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Bookmarks</h1>
          <p className="text-slate-400 mt-1">
            {bookmarks.length} bookmark{bookmarks.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusIcon className="w-5 h-5" />
          Add Bookmark
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => handleViewChange("cards")}
            className={`p-2 rounded-md transition-all cursor-pointer ${
              viewType === "cards"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
            title="Card view"
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleViewChange("list")}
            className={`p-2 rounded-md transition-all cursor-pointer ${
              viewType === "list"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
            title="List view"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === null
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === category.id
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              style={{
                backgroundColor:
                  selectedCategory === category.id
                    ? category.color
                    : "rgb(30 41 59 / 0.5)",
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-slate-800/50 rounded-xl animate-shimmer"
            />
          ))}
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 bg-slate-800/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {search || selectedCategory
              ? "No bookmarks found"
              : "No bookmarks yet"}
          </h3>
          <p className="text-slate-400 mb-6">
            {search || selectedCategory
              ? "Try adjusting your filters"
              : "Add your first bookmark to get started"}
          </p>
          {!search && !selectedCategory && (
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusIcon className="w-5 h-5" />
              Add Bookmark
            </Button>
          )}
        </motion.div>
      ) : viewType === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBookmarks.map((bookmark, index) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          <AnimatePresence mode="popLayout">
            {filteredBookmarks.map((bookmark, index) => (
              <BookmarkListItem
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <BookmarkForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleCreateOrUpdate}
        categories={categories}
        bookmark={editingBookmark}
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Bookmark"
        message="Are you sure you want to delete this bookmark? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
      />

      <ShortcutCommandBar
        isOpen={shortcutState.isOpen}
        sequence={shortcutState.sequence}
        exactMatch={shortcutState.exactMatch}
        hasLongerMatches={shortcutState.hasLongerMatches}
        activatedBookmark={shortcutState.activatedBookmark}
        selectedIndex={shortcutState.selectedIndex}
        potentialMatches={shortcutState.potentialMatches}
      />
    </div>
  );
}
