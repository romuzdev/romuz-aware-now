import { Check, ChevronDown, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { type AppRole } from "@/core/rbac";
import { cn } from "@/lib/utils";

const roleLabels: Record<AppRole, string> = {
  platform_admin: "roles.platform_admin",
  platform_support: "roles.platform_support",
  super_admin: "roles.super_admin",
  tenant_admin: "roles.tenant_admin",
  tenant_manager: "roles.tenant_manager",
  tenant_employee: "roles.tenant_employee",
  awareness_manager: "roles.awareness_manager",
  risk_manager: "roles.risk_manager",
  compliance_officer: "roles.compliance_officer",
  hr_manager: "roles.hr_manager",
  it_manager: "roles.it_manager",
  executive: "roles.executive",
  employee: "roles.employee",
  admin: "roles.admin",
  analyst: "roles.analyst",
  manager: "roles.manager",
  viewer: "roles.viewer",
};

export function RoleSelector() {
  const { t } = useTranslation();
  const { roles, activeRole, setActiveRole } = useAppContext();

  if (!activeRole || roles.length === 0) {
    return null;
  }

  // If user has only one role, show it without dropdown
  if (roles.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 text-secondary-foreground">
        <UserCircle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {t(roleLabels[activeRole])}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle className="h-4 w-4" />
          <span className="text-sm">{t(roleLabels[activeRole])}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {t("roleSelector.switchRole")}
        </div>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => setActiveRole(role)}
            className={cn(
              "cursor-pointer",
              activeRole === role && "bg-accent"
            )}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                activeRole === role ? "opacity-100" : "opacity-0"
              )}
            />
            <span>{t(roleLabels[role])}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
