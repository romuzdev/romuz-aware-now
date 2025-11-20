/**
 * Admin Layout Component
 * 
 * Unified layout for all admin/app routes
 * Uses the same pattern as LMS Layout
 */

import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/core/components/ui/sidebar";
import { AppSidebar } from "@/core/components/navigation/AppSidebar";
import { ThemeToggle } from "@/core/components/ui/theme-toggle";
import { LanguageToggle } from "@/core/components/ui/language-toggle";
import { HeaderAppSwitcher } from "@/core/components/navigation/HeaderAppSwitcher";
import { useTranslation } from "react-i18next";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <HeaderAppSwitcher />
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <section className="flex-1 p-6">{children}</section>
        </main>
      </div>
    </SidebarProvider>
  );
}
