"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { SortableBookmarkCard } from "@/components/SortableBookmarkCard";
import { SortableBookmarkListItem } from "@/components/SortableBookmarkListItem";
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
  const [showStarredOnly, setShowStarredOnly] = useState(false);

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

  async function handleStar(id: number) {
    try {
      const response = await fetch(`/api/bookmarks/${id}/star`, {
        method: "POST",
      });
      if (response.ok) {
        const updated = await response.json();
        setBookmarks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, starred: updated.starred } : b))
        );
      }
    } catch (error) {
      console.error("Failed to star bookmark:", error);
    }
  }

  // Enable keyboard shortcuts
  const shortcutState = useKeyboardShortcuts(bookmarks);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      if (Array.isArray(bookmarksData)) {
        setBookmarks(bookmarksData);
      }
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort bookmarks based on current view
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks.filter((b) => {
      const matchesSearch =
        !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.url.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === null || b.categoryId === selectedCategory;

      const matchesStarred = !showStarredOnly || b.starred;

      return matchesSearch && matchesCategory && matchesStarred;
    });

    // Sort by the appropriate order based on view
    if (selectedCategory !== null) {
      // Within a category, use categorySortOrder
      filtered = [...filtered].sort((a, b) => a.categorySortOrder - b.categorySortOrder);
    } else {
      // In "All" view, use global sortOrder
      filtered = [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return filtered;
  }, [bookmarks, search, selectedCategory, showStarredOnly]);

  // Check if drag is disabled (when searching or showing starred only)
  const isDragDisabled = !!search || showStarredOnly;

  // Handle drag end
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredBookmarks.findIndex((b) => b.id === active.id);
    const newIndex = filteredBookmarks.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array
    const newOrder = [...filteredBookmarks];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    // Update local state immediately for responsiveness
    const orderedIds = newOrder.map((b) => b.id);

    // Update the bookmarks state with new order
    setBookmarks((prev) => {
      const updated = [...prev];
      if (selectedCategory !== null) {
        // Update categorySortOrder for items in this category
        orderedIds.forEach((id, index) => {
          const bookmark = updated.find((b) => b.id === id);
          if (bookmark) {
            bookmark.categorySortOrder = index;
          }
        });
      } else {
        // Update global sortOrder
        orderedIds.forEach((id, index) => {
          const bookmark = updated.find((b) => b.id === id);
          if (bookmark) {
            bookmark.sortOrder = index;
          }
        });
      }
      return updated;
    });

    // Persist to server
    try {
      await fetch("/api/bookmarks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds,
          categoryId: selectedCategory,
        }),
      });
    } catch (error) {
      console.error("Failed to save order:", error);
      // Refetch to restore correct order on error
      fetchData();
    }
  }

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
            {filteredBookmarks.length === bookmarks.length ? (
              <>{bookmarks.length} bookmark{bookmarks.length !== 1 && "s"}</>
            ) : (
              <>{filteredBookmarks.length} of {bookmarks.length} bookmarks shown</>
            )}
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
            onClick={() => {
              const newValue = !showStarredOnly;
              setShowStarredOnly(newValue);
              if (newValue) {
                setSelectedCategory(null);
              }
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              showStarredOnly
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800/50 text-slate-400 hover:text-amber-400 border border-transparent"
            }`}
            title={showStarredOnly ? "Show all bookmarks" : "Show favorites only"}
          >
            {showStarredOnly ? (
              <StarSolidIcon className="w-4 h-4" />
            ) : (
              <StarIcon className="w-4 h-4" />
            )}
            Favorites
          </button>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === null && !showStarredOnly
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredBookmarks.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookmarks.map((bookmark, index) => (
                <SortableBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onStar={handleStar}
                  index={index}
                  isDragDisabled={isDragDisabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredBookmarks.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {filteredBookmarks.map((bookmark, index) => (
                <SortableBookmarkListItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onStar={handleStar}
                  index={index}
                  isDragDisabled={isDragDisabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
