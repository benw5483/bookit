"use client";

import { ReactNode } from "react";

export function DashboardContent({ children }: { children: ReactNode }) {
  return <main className="flex-1 overflow-auto">{children}</main>;
}
