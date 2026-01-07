"use client";

import { ReactNode } from "react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell
 * 
 * Global wrapper for customer/public pages.
 * Provides navbar and footer with consistent layout.
 * 
 * Usage:
 * ```tsx
 * <AppShell>
 *   <PageShell>
 *     <div>Content</div>
 *   </PageShell>
 * </AppShell>
 * ```
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden bg-white">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}

