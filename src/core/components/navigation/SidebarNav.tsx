import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/core/components/ui/sidebar";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { useSidebarFeatures } from "@/core/config/hooks/useAppRegistry";
import type { AppFeature } from "@/core/config/types";

interface SidebarNavProps {
  /** App ID to show features for */
  appId: string;
  /** Optional section title */
  title?: string;
}

/**
 * SidebarNav - Dynamic navigation based on app features
 * 
 * Automatically shows features from the app registry
 * Filters by permissions using RBAC
 * Highlights active routes
 */
export function SidebarNav({ appId, title }: SidebarNavProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Get features user has access to
  const features = useSidebarFeatures(appId);

  if (features.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      {!collapsed && title && (
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {features.map((feature) => {
            const isActive = location.pathname === feature.route || 
                           location.pathname.startsWith(feature.route + '/');
            
            return (
              <SidebarMenuItem key={feature.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={collapsed ? (i18n.language === 'ar' ? feature.nameAr : feature.name) : undefined}
                >
                  <NavLink
                    to={feature.route}
                    className={cn(
                      "cursor-pointer",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <feature.icon className="h-4 w-4" />
                    {!collapsed && (
                      <span>{i18n.language === 'ar' ? feature.nameAr : feature.name}</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
