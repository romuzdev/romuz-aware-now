import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  Target,
  BarChart3,
  LogOut,
  UserCircle,
  GitBranch,
  FileSpreadsheet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/core/components/ui/sidebar";
import { Button } from "@/core/components/ui/button";
import { ThemeToggle } from "@/core/components/ui/theme-toggle";
import { LanguageToggle } from "@/core/components/ui/language-toggle";
import { HeaderAppSwitcher } from "@/core/components/navigation/HeaderAppSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { NavLink } from "react-router-dom";

interface GRCLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "لوحة التحكم",
    titleEn: "Dashboard",
    url: "/grc/dashboard",
    icon: BarChart3,
  },
  {
    title: "المخاطر",
    titleEn: "Risks",
    url: "/grc/risks",
    icon: AlertTriangle,
  },
  {
    title: "الضوابط",
    titleEn: "Controls",
    url: "/grc/controls",
    icon: Shield,
  },
  {
    title: "الامتثال",
    titleEn: "Compliance",
    url: "/grc/compliance",
    icon: CheckCircle2,
  },
  {
    title: "التدقيقات",
    titleEn: "Audits",
    url: "/grc/audits",
    icon: Activity,
  },
  {
    title: "التقارير",
    titleEn: "Reports",
    url: "/grc/reports",
    icon: FileSpreadsheet,
  },
  {
    title: "ربط الأطر",
    titleEn: "Framework Mapping",
    url: "/grc/framework-mapping",
    icon: Target,
  },
  {
    title: "الأتمتة",
    titleEn: "Automation",
    url: "/grc/automation",
    icon: GitBranch,
  },
];

function GRCSidebar() {
  const { i18n } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const isRTL = i18n.language === "ar";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      side={isRTL ? "right" : "left"}
      className="border-sidebar-border"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {i18n.language === "ar" ? "نظام GRC" : "GRC System"}
              </span>
              <span className="text-xs text-muted-foreground">
                {i18n.language === "ar"
                  ? "الحوكمة والمخاطر والامتثال"
                  : "Governance, Risk & Compliance"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {i18n.language === "ar" ? "القائمة الرئيسية" : "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== "/grc/dashboard" &&
                    location.pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={
                        collapsed
                          ? i18n.language === "ar"
                            ? item.title
                            : item.titleEn
                          : undefined
                      }
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <span>
                            {i18n.language === "ar" ? item.title : item.titleEn}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        <div className="p-2 space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate("/auth/complete-profile")}
                className="h-auto p-3 hover:bg-accent/50 transition-all"
              >
                {collapsed ? (
                  <div className="w-full flex items-center justify-center">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                      <span className="truncate text-sm font-medium">
                        {user?.email?.split("@")[0] || "User"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {!collapsed && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {i18n.language === "ar" ? "تسجيل الخروج" : "Logout"}
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function GRCLayout({ children }: GRCLayoutProps) {
  const { i18n } = useTranslation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <GRCSidebar />
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
