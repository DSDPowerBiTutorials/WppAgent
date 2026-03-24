"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar, TopBar } from "@/components/dashboard";
import { AgentsProvider } from "@/lib/agents-context";
import { ToastProvider } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AgentsProvider>
          <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
        </AgentsProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
