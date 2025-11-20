import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle, Settings, HelpCircle, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/core/components/ui/sidebar";
import { Button } from "@/core/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { NavLink } from "react-router-dom";
import { useAvailableApps, useSidebarFeatures } from "@/core/config/hooks/useAppRegistry";
import { useMemo } from "react";

/**
 * AppSidebar - القائمة الجانبية الرئيسية
 * 
 * Features:
 * - Dynamic app-based navigation from registry
 * - User profile and settings
 * - RTL support
 * - Unified design pattern (based on LMS Layout)
 */
export function AppSidebar() {
  const { i18n } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppContext();
  const isRTL = i18n.language === 'ar';
  
  // Get available apps and determine current app
  const availableApps = useAvailableApps();
  const currentApp = useMemo(() => {
    const sorted = [...availableApps].sort((a, b) => b.route.length - a.route.length);
    return sorted.find((app) => location.pathname.startsWith(app.route));
  }, [availableApps, location.pathname]);

  // Get sidebar features for current app
  const sidebarFeatures = useSidebarFeatures(currentApp?.id || '');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  return (
    <Sidebar 
      collapsible="icon" 
      side={isRTL ? "right" : "left"}
      className="border-sidebar-border"
    >
      {/* App Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {currentApp && (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <currentApp.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {i18n.language === "ar" ? currentApp.nameAr : currentApp.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentApp.description}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Dynamic Navigation */}
      <SidebarContent>
        {sidebarFeatures.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {i18n.language === "ar" ? "القائمة الرئيسية" : "Main Menu"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarFeatures.map((feature) => {
                  const fullRoute = (() => {
                    const base = currentApp?.route || '';
                    const fr = feature.route || '';
                    if (!fr || fr === '/') return base;
                    if (fr.startsWith(base)) return fr;
                    if (fr.startsWith('/')) return `${base}${fr}`.replace(/\/+/g, '/');
                    return `${base}/${fr}`.replace(/\/+/g, '/');
                  })();
                  
                  const isActive =
                    location.pathname === fullRoute ||
                    (fullRoute !== currentApp?.route &&
                      location.pathname.startsWith(fullRoute));

                  return (
                    <SidebarMenuItem key={feature.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={collapsed ? (i18n.language === "ar" ? feature.nameAr : feature.name) : undefined}
                      >
                        <NavLink to={fullRoute}>
                          <feature.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span>
                              {i18n.language === "ar" ? feature.nameAr : feature.name}
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
        )}
      </SidebarContent>

      {/* User Profile & Settings Section */}
      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        <div className="p-2 space-y-2">
          {/* الملف الشخصي - بطاقة مميزة */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/auth/complete-profile')}
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
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                {i18n.language === "ar" ? "الإعدادات" : "Settings"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                onClick={() => navigate("/help")}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                {i18n.language === "ar" ? "المساعدة" : "Help"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {i18n.language === "ar" ? "تسجيل الخروج" : "Logout"}
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
