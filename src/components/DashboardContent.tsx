"use client";

import { ReactNode } from "react";
import { useSidebar } from "./SidebarContext";

export function DashboardContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <main
      className="flex-1 overflow-auto transition-all duration-300"
      style={{ paddingLeft: isOpen ? 0 : 60 }}
    >
      {children}
    </main>
  );
}
