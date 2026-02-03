"use client";

import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { KeyboardShortcutInput } from "./KeyboardShortcutInput";
import type { Bookmark, Category } from "@/db/schema";

interface BookmarkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookmarkFormData) => Promise<void>;
  categories: Category[];
  bookmark?: (Bookmark & { category: Category | null }) | null;
}

export interface BookmarkFormData {
  name: string;
  url: string;
  description: string;
  favicon: string | null;
  customImage: string | null;
  categoryId: number | null;
  keyboardShortcut: string | null;
}

export function BookmarkForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  bookmark,
}: BookmarkFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookmarkFormData>({
    name: "",
    url: "",
    description: "",
    favicon: null,
    customImage: null,
    categoryId: null,
    keyboardShortcut: null,
  });

  useEffect(() => {
    setError(null);
    if (bookmark) {
      setFormData({
        name: bookmark.name,
        url: bookmark.url,
        description: bookmark.description || "",
        favicon: bookmark.favicon,
        customImage: bookmark.customImage,
        categoryId: bookmark.categoryId,
        keyboardShortcut: bookmark.keyboardShortcut,
      });
    } else {
      setFormData({
        name: "",
        url: "",
        description: "",
        favicon: null,
        customImage: null,
        categoryId: null,
        keyboardShortcut: null,
      });
    }
  }, [bookmark, isOpen]);

  async function fetchMetadata(url: string) {
    if (!url) return;

    setFetchingMetadata(true);

    try {
      // Fetch title and favicon in parallel
      const [metadataRes, faviconRes] = await Promise.all([
        fetch(`/api/metadata?url=${encodeURIComponent(url)}`),
        formData.favicon || formData.customImage
          ? Promise.resolve(null)
          : fetch(`/api/favicon?url=${encodeURIComponent(url)}`),
      ]);

      const metadataData = await metadataRes.json();

      // Only set name if it's currently empty
      if (metadataData.title && !formData.name) {
        setFormData((prev) => ({ ...prev, name: metadataData.title }));
      }

      // Set favicon if we fetched it
      if (faviconRes) {
        const faviconData = await faviconRes.json();
        if (faviconData.favicon) {
          setFormData((prev) => ({ ...prev, favicon: faviconData.favicon }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
    } finally {
      setFetchingMetadata(false);
    }
  }

  async function handleUrlBlur() {
    if (formData.url) {
      // Only fetch if we need either name or favicon
      const needsName = !formData.name;
      const needsFavicon = !formData.favicon && !formData.customImage;

      if (needsName || needsFavicon) {
        await fetchMetadata(formData.url);
      }
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await response.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, customImage: data.url }));
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save bookmark");
      }
      console.error("Failed to save bookmark:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookmark ? "Edit Bookmark" : "Add Bookmark"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          id="url"
          label="URL"
          type="url"
          value={formData.url}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, url: e.target.value }))
          }
          onBlur={handleUrlBlur}
          placeholder="https://example.com"
          required
          autoFocus={!bookmark}
        />

        <div className="relative">
          <Input
            id="name"
            label="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={fetchingMetadata ? "Fetching title..." : "My Bookmark"}
            required
            disabled={fetchingMetadata}
          />
          {fetchingMetadata && (
            <div className="absolute right-3 top-9">
              <svg
                className="animate-spin h-4 w-4 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="A brief description..."
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <Select
          id="category"
          label="Category (optional)"
          value={formData.categoryId?.toString() || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              categoryId: e.target.value ? parseInt(e.target.value) : null,
            }))
          }
          options={[
            { value: "", label: "No category" },
            ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Image
          </label>
          <div className="flex items-center gap-4">
            {(formData.customImage || formData.favicon) && (
              <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center overflow-hidden">
                <img
                  src={formData.customImage || formData.favicon || ""}
                  alt="Preview"
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600 file:cursor-pointer cursor-pointer"
              />
              <p className="mt-1 text-xs text-slate-500">
                {fetchingMetadata
                  ? "Fetching favicon..."
                  : "Upload custom image or leave empty for auto-favicon"}
              </p>
            </div>
          </div>
        </div>

        <KeyboardShortcutInput
          value={formData.keyboardShortcut}
          onChange={(shortcut) =>
            setFormData((prev) => ({ ...prev, keyboardShortcut: shortcut }))
          }
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || fetchingMetadata}>
            {loading ? "Saving..." : bookmark ? "Update" : "Add Bookmark"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
