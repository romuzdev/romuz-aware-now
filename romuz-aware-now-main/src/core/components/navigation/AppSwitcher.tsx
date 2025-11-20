import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/core/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAvailableApps } from "@/core/config/hooks/useAppRegistry";
import type { AppModule } from "@/core/config/types";

/**
 * AppSwitcher - Component for switching between apps
 * 
 * Shows available apps based on user permissions
 * Highlights the currently active app
 */
export function AppSwitcher() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Get apps the user has access to
  const availableApps = useAvailableApps();
  
  // Determine current app from route
  const currentApp = availableApps.find(app => 
    location.pathname.startsWith(app.route)
  ) || availableApps[0];

  const handleAppSelect = (app: AppModule) => {
    navigate(app.route);
  };

  if (collapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {currentApp && <currentApp.icon className="h-5 w-5" />}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={i18n.language === 'ar' ? 'left' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t("sidebar.apps")}
              </DropdownMenuLabel>
              {availableApps.map((app) => (
                <DropdownMenuItem
                  key={app.id}
                  onClick={() => handleAppSelect(app)}
                  className="gap-2 p-2"
                >
                  <app.icon className="h-4 w-4" />
                  <span>{i18n.language === 'ar' ? app.nameAr : app.name}</span>
                  {currentApp?.id === app.id && (
                    <Check className="ms-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {currentApp && (
                <>
                  <div
                    className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground"
                    style={{ backgroundColor: currentApp.color }}
                  >
                    <currentApp.icon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {i18n.language === 'ar' ? currentApp.nameAr : currentApp.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {currentApp.description}
                    </span>
                  </div>
                  <ChevronsUpDown className="ms-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={i18n.language === 'ar' ? 'left' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("sidebar.apps")}
            </DropdownMenuLabel>
            {availableApps.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => handleAppSelect(app)}
                className="gap-2 p-2"
              >
                <div
                  className="flex size-6 items-center justify-center rounded-sm border"
                  style={{ backgroundColor: app.color }}
                >
                  <app.icon className="size-4 shrink-0 text-white" />
                </div>
                <span>{i18n.language === 'ar' ? app.nameAr : app.name}</span>
                {currentApp?.id === app.id && (
                  <Check className="ms-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
            
            {availableApps.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                {t("sidebar.noAppsAvailable")}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
