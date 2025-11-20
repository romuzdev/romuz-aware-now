import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/core/components/ui/sidebar";
import { AppSidebar } from "@/core/components/navigation/AppSidebar";
import { ThemeToggle } from "@/core/components/ui/theme-toggle";
import { LanguageToggle } from "@/core/components/ui/language-toggle";
import { RoleSelector } from "@/core/components/ui/role-selector";
import { DemoRoleSwitcher } from "@/core/components/ui/demo-role-switcher";
import { DemoModeBanner } from "@/core/components/ui/demo-mode-banner";
import { HeaderAppSwitcher } from "@/core/components/navigation/HeaderAppSwitcher";
import { useTranslation } from "react-i18next";

export default function AppShell() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <DemoModeBanner />
          
          <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <HeaderAppSwitcher />
            </div>
            <div className="flex items-center gap-2">
              <DemoRoleSwitcher />
              <RoleSelector />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <section className="flex-1 p-6">
            <Outlet />
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}
