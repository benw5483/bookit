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
        "bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-[72px]"
      )}
    >
      {/* Header */}
      <div className="border-b border-slate-700/50">
        {isOpen ? (
          <div className="p-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <BookmarkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Bookit</span>
            </Link>
            <button
              onClick={toggle}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center gap-2">
            <Link href="/">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <BookmarkIcon className="w-5 h-5 text-white" />
              </div>
            </Link>
            <Tooltip content="Expand" position="right">
              <button
                onClick={toggle}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (isOpen) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
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
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          }

          return (
            <Tooltip key={item.href} content={item.label} position="right">
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center justify-center w-full h-12 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-indigo-400 bg-indigo-600/20 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                )}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50">
        {isOpen ? (
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Tooltip content="Sign Out" position="right">
            <button
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.href = "/login";
              }}
              className="flex items-center justify-center w-full h-12 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
