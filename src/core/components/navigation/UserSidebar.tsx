import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  User,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Settings,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/core/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface UserSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

interface SidebarItem {
  id: string;
  title: string;
  icon: any;
}

const sidebarItems: SidebarItem[] = [
  { id: "overview", title: "userSidebar.overview", icon: Home },
  { id: "profile", title: "userSidebar.profile", icon: User },
  { id: "tasks", title: "userSidebar.tasks", icon: CheckCircle2 },
  { id: "progress", title: "userSidebar.progress", icon: TrendingUp },
  { id: "campaigns", title: "userSidebar.campaigns", icon: BookOpen },
  { id: "settings", title: "userSidebar.settings", icon: Settings },
];

/**
 * UserSidebar - القائمة الجانبية الخاصة بصفحة User
 * 
 * تحتوي على روابط للأقسام الداخلية:
 * - نظرة عامة (Overview)
 * - ملفي الشخصي (Profile)
 * - المهام (Tasks)
 * - التقدم (Progress)
 * - الحملات (Campaigns)
 * - الإعدادات (Settings)
 */
export function UserSidebar({ activeSection = "overview", onSectionChange }: UserSidebarProps) {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleSectionClick = (sectionId: string) => {
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && t("userSidebar.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleSectionClick(item.id)}
                      isActive={isActive}
                      className={cn(
                        "cursor-pointer",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
