import type { Bookmark, Category } from "@/db/schema";

export type BookmarkWithCategory = Bookmark & {
  category: Category | null;
};
