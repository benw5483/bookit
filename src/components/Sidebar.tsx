"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BookmarkIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { Tooltip } from "./ui/Tooltip";

const navItems = [
  { href: "/", label: "Bookmarks", icon: BookmarkIcon },
  { href: "/categories", label: "Categories", icon: FolderIcon },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between min-h-[72px]">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 transition-opacity duration-200",
            !isOpen && "opacity-0 pointer-events-none"
          )}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <BookmarkIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white whitespace-nowrap">
            Bookit
          </span>
        </Link>
        {!isOpen && (
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0 absolute left-3">
            <BookmarkIcon className="w-5 h-5 text-white" />
          </div>
        )}
        <Tooltip content={isOpen ? "Collapse" : "Expand"} position="right">
          <button
            onClick={toggle}
            className={cn(
              "p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer shrink-0",
              !isOpen && "absolute right-3"
            )}
          >
            {isOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </Tooltip>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip
              key={item.href}
              content={item.label}
              position="right"
              disabled={isOpen}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50",
                  !isOpen && "justify-center"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-lg"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10 shrink-0" />
                <span
                  className={cn(
                    "relative z-10 whitespace-nowrap transition-opacity duration-200",
                    !isOpen && "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-700/50">
        <Tooltip content="Sign Out" position="right" disabled={isOpen}>
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer",
              !isOpen && "justify-center"
            )}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap transition-opacity duration-200",
                !isOpen && "opacity-0 w-0 overflow-hidden"
              )}
            >
              Sign Out
            </span>
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
