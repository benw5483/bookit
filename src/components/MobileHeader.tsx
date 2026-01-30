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
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const navItems = [
  { href: "/", label: "Bookmarks", icon: BookmarkIcon },
  { href: "/categories", label: "Categories", icon: FolderIcon },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

export function MobileHeader() {
  const pathname = usePathname();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useSidebar();

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-50 bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Bookit</span>
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={closeMobileMenu}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed top-[61px] left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 z-50 shadow-xl"
            >
              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "text-indigo-400 bg-indigo-600/20 border border-indigo-500/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-slate-700/50">
                <button
                  onClick={async () => {
                    closeMobileMenu();
                    await signOut({ redirect: false });
                    window.location.href = "/login";
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all cursor-pointer"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
