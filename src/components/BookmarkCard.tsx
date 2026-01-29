"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  CommandLineIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import type { Bookmark, Category } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Tooltip } from "./ui/Tooltip";
import { useColorExtractor } from "@/hooks/useColorExtractor";

interface BookmarkCardProps {
  bookmark: Bookmark & { category: Category | null };
  onEdit: (bookmark: Bookmark & { category: Category | null }) => void;
  onDelete: (id: number) => void;
  onStar: (id: number) => void;
  index: number;
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onStar,
  index,
}: BookmarkCardProps) {
  const imageUrl = bookmark.customImage || bookmark.favicon;
  const { gradient, borderColor } = useColorExtractor(imageUrl);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(bookmark);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(bookmark.id);
  }

  function handleStar(e: React.MouseEvent) {
    e.stopPropagation();
    onStar(bookmark.id);
  }

  // Fallback gradient using category color or default
  const fallbackGradient = bookmark.category?.color
    ? `linear-gradient(135deg, ${bookmark.category.color}20 0%, ${bookmark.category.color}05 100%)`
    : "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)";

  const backgroundStyle = gradient || fallbackGradient;

  // Fallback border color using category color or default
  const fallbackBorderColor = bookmark.category?.color
    ? `${bookmark.category.color}50`
    : "rgba(51, 65, 85, 0.5)";

  const borderStyle = borderColor || fallbackBorderColor;

  return (
    <motion.div
      layout
      layoutId={`bookmark-${bookmark.id}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        delay: index * 0.03,
      }}
      whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
      onClick={handleOpen}
      className="group relative backdrop-blur-sm rounded-xl border shadow-lg overflow-hidden cursor-pointer"
      style={{ background: backgroundStyle, borderColor: borderStyle }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-slate-900/40" />

      {/* Star button - top right */}
      <Tooltip content={bookmark.starred ? "Remove from favorites" : "Add to favorites"}>
        <button
          onClick={handleStar}
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-lg transition-all cursor-pointer z-10",
            bookmark.starred
              ? "text-amber-400 hover:text-amber-300"
              : "text-slate-400 hover:text-amber-400 opacity-0 group-hover:opacity-100"
          )}
        >
          {bookmark.starred ? (
            <StarSolidIcon className="w-5 h-5" />
          ) : (
            <StarOutlineIcon className="w-5 h-5" />
          )}
        </button>
      </Tooltip>

      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-slate-800/60 backdrop-blur-sm">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={bookmark.name}
                width={32}
                height={32}
                className="object-contain"
                unoptimized={imageUrl.startsWith("http")}
              />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: bookmark.category?.color || "#6366f1" }}
              >
                {bookmark.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {bookmark.name}
            </h3>
            <p className="text-sm text-slate-300 truncate">{bookmark.url}</p>
            {bookmark.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                {bookmark.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {bookmark.category && (
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                )}
                style={{
                  backgroundColor: `${bookmark.category.color}30`,
                  color: bookmark.category.color,
                }}
              >
                {bookmark.category.name}
              </span>
            )}
            {bookmark.keyboardShortcut && (
              <Tooltip content={`Type "${bookmark.keyboardShortcut}" to open`}>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 backdrop-blur-sm rounded-full text-xs font-mono text-slate-300">
                  <CommandLineIcon className="w-3 h-3" />
                  {bookmark.keyboardShortcut}
                </span>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Tooltip content="Open in new tab">
                <button
                  onClick={handleOpen}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Edit bookmark">
                <button
                  onClick={handleEdit}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Delete bookmark">
                <button
                  onClick={handleDelete}
                  className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
