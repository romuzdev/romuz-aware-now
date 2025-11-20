import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/lib/utils";
import { useAvailableApps } from "@/core/config/hooks/useAppRegistry";
import type { AppModule } from "@/core/config/types";

/**
 * HeaderAppSwitcher - مبدل التطبيقات في Header
 * 
 * قائمة منسدلة للتنقل السريع بين التطبيقات
 * - يظهر التطبيق الحالي
 * - يعرض جميع التطبيقات المتاحة للمستخدم
 * - يدعم RTL
 */
export function HeaderAppSwitcher() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get apps the user has access to
  const availableApps = useAvailableApps();
  
  // Determine current app from route (match longest route first)
  const currentApp = useMemo(() => {
    const sortedApps = [...availableApps].sort((a, b) => b.route.length - a.route.length);
    return sortedApps.find(app => location.pathname.startsWith(app.route)) || availableApps[0];
  }, [availableApps, location.pathname]);

  const handleAppSelect = (app: AppModule) => {
    navigate(app.route);
  };

  if (!currentApp) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 min-w-[200px] justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-5 h-5 rounded"
              style={{ backgroundColor: currentApp.color }}
            >
              <currentApp.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium">
              {i18n.language === 'ar' ? currentApp.nameAr : currentApp.name}
            </span>
          </div>
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start"
        className="w-[250px] bg-popover/95 backdrop-blur-sm z-50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("sidebar.apps")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableApps.map((app) => (
          <DropdownMenuItem
            key={app.id}
            onClick={() => handleAppSelect(app)}
            className={cn(
              "gap-2 cursor-pointer",
              currentApp?.id === app.id && "bg-accent"
            )}
          >
            <div
              className="flex items-center justify-center w-5 h-5 rounded-sm border"
              style={{ backgroundColor: app.color }}
            >
              <app.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="flex-1">
              {i18n.language === 'ar' ? app.nameAr : app.name}
            </span>
            {currentApp?.id === app.id && (
              <Check className="w-4 h-4" />
            )}
          </DropdownMenuItem>
        ))}
        
        {availableApps.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground text-center">
            {t("sidebar.noAppsAvailable")}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
