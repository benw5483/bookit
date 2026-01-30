"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  CommandLineIcon,
  PencilIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import type { Bookmark, Category } from "@/db/schema";
import { useColorExtractor } from "@/hooks/useColorExtractor";

interface BookmarkListItemProps {
  bookmark: Bookmark & { category: Category | null };
  onEdit: (bookmark: Bookmark & { category: Category | null }) => void;
  onDelete: (id: number) => void;
  onStar: (id: number) => void;
  index: number;
}

export function BookmarkListItem({
  bookmark,
  onEdit,
  onDelete,
  onStar,
  index,
}: BookmarkListItemProps) {
  const imageUrl = bookmark.customImage || bookmark.favicon;
  const { borderColor } = useColorExtractor(imageUrl);

  // Fallback border color using category color or default
  const fallbackBorderColor = bookmark.category?.color
    ? `${bookmark.category.color}50`
    : "rgba(51, 65, 85, 0.3)";

  const borderStyle = borderColor || fallbackBorderColor;

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }

  function handleStar(e: React.MouseEvent) {
    e.stopPropagation();
    onStar(bookmark.id);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(bookmark);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, pointerEvents: "none" }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
      onClick={handleOpen}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(bookmark);
      }}
      className="group relative flex items-center gap-3 px-3 py-2 bg-slate-800/30 hover:bg-slate-800/60 border rounded-lg cursor-pointer transition-all overflow-visible"
      style={{ borderColor: borderStyle }}
    >
      {/* Star button - absolute positioned top right */}
      <button
        onClick={handleStar}
        className={`absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-slate-900 transition-all cursor-pointer z-10 ${
          bookmark.starred
            ? "text-amber-400 hover:text-amber-300"
            : "text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100"
        }`}
      >
        {bookmark.starred ? (
          <StarSolidIcon className="w-3.5 h-3.5" />
        ) : (
          <StarOutlineIcon className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Favicon */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={20}
            height={20}
            className="object-contain"
            unoptimized={imageUrl.startsWith("http")}
          />
        ) : (
          <span
            className="text-xs font-bold"
            style={{ color: bookmark.category?.color || "#6366f1" }}
          >
            {bookmark.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-sm text-slate-200 truncate">
        {bookmark.name}
      </span>

      {/* Edit button */}
      <button
        onClick={handleEdit}
        className="shrink-0 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        <PencilIcon className="w-4 h-4" />
      </button>

      {/* Category indicator */}
      {bookmark.category && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: bookmark.category.color }}
        />
      )}

      {/* Keyboard shortcut */}
      {bookmark.keyboardShortcut && (
        <span className="relative z-20 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs font-mono text-slate-400 shrink-0">
          <CommandLineIcon className="w-3 h-3" />
          {bookmark.keyboardShortcut}
        </span>
      )}
    </motion.div>
  );
}
