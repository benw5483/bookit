"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookmarkListItem } from "./BookmarkListItem";
import type { Bookmark, Category } from "@/db/schema";

interface SortableBookmarkListItemProps {
  bookmark: Bookmark & { category: Category | null };
  onEdit: (bookmark: Bookmark & { category: Category | null }) => void;
  onDelete: (id: number) => void;
  onStar: (id: number) => void;
  index: number;
  isDragDisabled?: boolean;
}

export function SortableBookmarkListItem({
  bookmark,
  onEdit,
  onDelete,
  onStar,
  index,
  isDragDisabled = false,
}: SortableBookmarkListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkListItem
        bookmark={bookmark}
        onEdit={onEdit}
        onDelete={onDelete}
        onStar={onStar}
        index={index}
      />
    </div>
  );
}
