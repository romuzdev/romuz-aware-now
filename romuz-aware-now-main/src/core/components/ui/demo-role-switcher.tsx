import { Check, ChevronDown, TestTube2, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/core/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip";
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

// All available roles organized by category
const allRoles: { category: string; roles: AppRole[] }[] = [
  {
    category: "Platform Roles",
    roles: ["super_admin", "tenant_admin"],
  },
  {
    category: "Persona Roles",
    roles: [
      "awareness_manager",
      "risk_manager",
      "compliance_officer",
      "hr_manager",
      "it_manager",
      "executive",
      "employee",
    ],
  },
  {
    category: "Legacy Roles",
    roles: ["admin", "manager", "analyst", "viewer"],
  },
];

const roleIcons: Record<AppRole, string> = {
  platform_admin: "🔐",
  platform_support: "🆘",
  super_admin: "⚡",
  tenant_admin: "👔",
  tenant_manager: "📊",
  tenant_employee: "👨‍💻",
  awareness_manager: "👨‍💼",
  risk_manager: "🛡️",
  compliance_officer: "📋",
  hr_manager: "👥",
  it_manager: "💻",
  executive: "📊",
  employee: "👤",
  admin: "🔧",
  manager: "📈",
  analyst: "🔍",
  viewer: "👁️",
};

// وصف مختصر لكل دور
const roleDescriptions: Record<AppRole, string> = {
  platform_admin: "roleDescriptions.platform_admin",
  platform_support: "roleDescriptions.platform_support",
  super_admin: "roleDescriptions.super_admin",
  tenant_admin: "roleDescriptions.tenant_admin",
  tenant_manager: "roleDescriptions.tenant_manager",
  tenant_employee: "roleDescriptions.tenant_employee",
  awareness_manager: "roleDescriptions.awareness_manager",
  risk_manager: "roleDescriptions.risk_manager",
  compliance_officer: "roleDescriptions.compliance_officer",
  hr_manager: "roleDescriptions.hr_manager",
  it_manager: "roleDescriptions.it_manager",
  executive: "roleDescriptions.executive",
  employee: "roleDescriptions.employee",
  admin: "roleDescriptions.admin",
  manager: "roleDescriptions.manager",
  analyst: "roleDescriptions.analyst",
  viewer: "roleDescriptions.viewer",
};

/**
 * Demo Role Switcher - للتبديل بين جميع الأدوار لأغراض الاختبار
 * 
 * يعرض جميع الأدوار المتاحة في النظام مرتبة حسب الفئة
 * يسمح بالتبديل الفوري بين أي دور لمعاينة واجهات المستخدم المختلفة
 */
export function DemoRoleSwitcher() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeRole, setActiveRole } = useAppContext();

  // Role-to-route mapping (نفس الـ mapping الموجود في AppIndex.tsx)
  const roleRouteMap: Record<AppRole, string> = {
    'platform_admin': '/app/admin',
    'platform_support': '/app/admin',
    'super_admin': '/app/admin',
    'tenant_admin': '/app/admin',
    'tenant_manager': '/app/awareness',
    'tenant_employee': '/app/user',
    'awareness_manager': '/app/awareness',
    'risk_manager': '/app/risk',
    'compliance_officer': '/app/compliance',
    'hr_manager': '/app/hr',
    'it_manager': '/app/it',
    'executive': '/app/executive',
    'employee': '/app/user',
    // Legacy roles fallback
    'admin': '/app/admin',
    'manager': '/app/awareness',
    'analyst': '/app/executive',
    'viewer': '/app/user',
  };

  const handleRoleChange = (role: AppRole) => {
    setActiveRole(role);
    // الانتقال التلقائي للصفحة المناسبة بناءً على الدور
    const targetRoute = roleRouteMap[role] || '/app/user';
    navigate(targetRoute, { replace: true });
  };

  if (!activeRole) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-dashed">
            <TestTube2 className="h-4 w-4" />
            <span className="text-sm">Demo Mode</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-popover z-50 max-h-[500px] overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            Switch to Another Role
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {allRoles.map((category) => (
            <div key={category.category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {category.category}
              </div>
              {category.roles.map((role) => (
                <Tooltip key={role}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(role)}
                      className={cn(
                        "cursor-pointer flex items-center gap-2",
                        activeRole === role && "bg-accent"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          activeRole === role ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="text-lg">{roleIcons[role]}</span>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{t(roleLabels[role])}</span>
                        {activeRole === role && (
                          <span className="text-xs text-muted-foreground">Active</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">{t(roleDescriptions[role])}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
          
          <div className="px-2 py-2 text-xs text-muted-foreground">
            ⚠️ Demo Mode: للاختبار فقط
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
