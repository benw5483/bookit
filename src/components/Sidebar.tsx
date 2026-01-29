"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookmarkIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  Bars3Icon,
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
    <>
      {/* Collapsed toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={toggle}
            className="fixed top-4 left-4 z-50 p-2.5 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shadow-lg cursor-pointer"
          >
            <Bars3Icon className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -256, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col h-screen sticky top-0 shrink-0"
          >
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <BookmarkIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Bookit</span>
              </Link>
              <Tooltip content="Collapse sidebar" position="right">
                <button
                  onClick={toggle}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
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
              })}
            </nav>

            <div className="p-4 border-t border-slate-700/50">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
