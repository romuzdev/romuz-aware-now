/**
 * DocumentStatusBadge Component
 * 
 * Displays a colored badge indicating document status
 */

import { Badge } from "@/core/components/ui/badge";

type DocumentStatus = "draft" | "review" | "approved" | "archived";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    variant: "secondary" as const,
  },
  review: {
    label: "In Review",
    variant: "outline" as const,
  },
  approved: {
    label: "Approved",
    variant: "default" as const,
  },
  archived: {
    label: "Archived",
    variant: "secondary" as const,
  },
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}
