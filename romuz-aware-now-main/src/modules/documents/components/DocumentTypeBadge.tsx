/**
 * DocumentTypeBadge Component
 * 
 * Displays a colored badge indicating document type
 */

import { Badge } from "@/core/components/ui/badge";
import { FileText, ClipboardCheck, BookOpen, FileCode, BarChart3, FileQuestion } from "lucide-react";

type DocumentType = "policy" | "procedure" | "guideline" | "form" | "report" | "other";

interface DocumentTypeBadgeProps {
  type: DocumentType;
}

const TYPE_CONFIG = {
  policy: {
    label: "Policy",
    icon: FileText,
  },
  procedure: {
    label: "Procedure",
    icon: ClipboardCheck,
  },
  guideline: {
    label: "Guideline",
    icon: BookOpen,
  },
  form: {
    label: "Form",
    icon: FileCode,
  },
  report: {
    label: "Report",
    icon: BarChart3,
  },
  other: {
    label: "Other",
    icon: FileQuestion,
  },
};

export function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="whitespace-nowrap gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
