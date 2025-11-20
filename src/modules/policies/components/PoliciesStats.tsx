import { useMemo } from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { FileText, CheckCircle2, Edit3, Archive } from "lucide-react";
import type { Policy } from "../types/policy.types";

interface PoliciesStatsProps {
  policies: Policy[];
}

export function PoliciesStats({ policies }: PoliciesStatsProps) {
  const stats = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((p) => p.status === "active").length;
    const draft = policies.filter((p) => p.status === "draft").length;
    const archived = policies.filter((p) => p.status === "archived").length;

    return { total, active, draft, archived };
  }, [policies]);

  const statCards = [
    {
      label: "Total Policies",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Drafts",
      value: stats.draft,
      icon: Edit3,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Archived",
      value: stats.archived,
      icon: Archive,
      color: "text-slate-600",
      bgColor: "bg-slate-50 dark:bg-slate-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
