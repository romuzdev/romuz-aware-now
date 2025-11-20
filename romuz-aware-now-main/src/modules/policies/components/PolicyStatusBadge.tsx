import { Badge } from "@/core/components/ui/badge";
import type { PolicyStatus } from "../types/policy.types";

interface PolicyStatusBadgeProps {
  status: PolicyStatus;
}

export function PolicyStatusBadge({ status }: PolicyStatusBadgeProps) {
  const statusConfig: Record<
    PolicyStatus,
    { label: string; className: string }
  > = {
    active: {
      label: "Active",
      className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
    },
    draft: {
      label: "Draft",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    },
    archived: {
      label: "Archived",
      className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
