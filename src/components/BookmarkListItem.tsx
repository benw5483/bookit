"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CommandLineIcon } from "@heroicons/react/24/outline";
import type { Bookmark, Category } from "@/db/schema";

interface BookmarkListItemProps {
  bookmark: Bookmark & { category: Category | null };
  onEdit: (bookmark: Bookmark & { category: Category | null }) => void;
  onDelete: (id: number) => void;
  index: number;
}

export function BookmarkListItem({
  bookmark,
  onEdit,
  onDelete,
  index,
}: BookmarkListItemProps) {
  const imageUrl = bookmark.customImage || bookmark.favicon;

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    // Could add context menu later, for now just prevent default
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      onClick={handleOpen}
      onContextMenu={handleContextMenu}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(bookmark);
      }}
      className="group flex items-center gap-3 px-3 py-2 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 rounded-lg cursor-pointer transition-all"
    >
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

      {/* Category indicator */}
      {bookmark.category && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: bookmark.category.color }}
        />
      )}

      {/* Keyboard shortcut */}
      {bookmark.keyboardShortcut && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs font-mono text-slate-400 shrink-0">
          <CommandLineIcon className="w-3 h-3" />
          {bookmark.keyboardShortcut}
        </span>
      )}
    </motion.div>
  );
}
