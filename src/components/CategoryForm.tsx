"use client";

import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import type { Category } from "@/db/schema";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category | null;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string | null;
}

const presetColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
];

export function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  category,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    color: "#6366f1",
    icon: null,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
    } else {
      setFormData({
        name: "",
        color: "#6366f1",
        icon: null,
      });
    }
  }, [category, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Category" : "Add Category"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="name"
          label="Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="My Category"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
                className={`w-10 h-10 rounded-lg transition-all cursor-pointer ${
                  formData.color === color
                    ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-slate-400">Custom:</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
            />
            <span className="text-sm text-slate-500 font-mono">
              {formData.color}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : category ? "Update" : "Add Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
