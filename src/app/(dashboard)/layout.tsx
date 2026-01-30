"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { SidebarProvider } from "@/components/SidebarContext";
import { DashboardContent } from "@/components/DashboardContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <MobileHeader />
        <div className="flex">
          <Sidebar />
          <DashboardContent>{children}</DashboardContent>
        </div>
      </div>
    </SidebarProvider>
  );
}
