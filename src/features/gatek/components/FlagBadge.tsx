import { Badge } from "@/core/components/ui/badge";

interface FlagBadgeProps {
  flag: string;
}

export function FlagBadge({ flag }: FlagBadgeProps) {
  const config = {
    alert: { label: "تنبيه", variant: "destructive" as const },
    warn: { label: "تحذير", variant: "secondary" as const },
    ok: { label: "طبيعي", variant: "default" as const },
    no_ref: { label: "لا مرجع", variant: "outline" as const },
  };

  const { label, variant } = config[flag as keyof typeof config] || config.no_ref;

  return <Badge variant={variant}>{label}</Badge>;
}
