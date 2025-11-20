import type { Policy } from "@/modules/policies";

/**
 * Export policies to CSV format
 * @param policies - Array of policies to export
 * @param filename - Optional filename (defaults to policies_export_YYYY-MM-DD.csv)
 */
export function exportPoliciesToCSV(policies: Policy[], filename?: string) {
  if (policies.length === 0) {
    throw new Error("لا توجد بيانات للتصدير");
  }

  // CSV Headers (in Arabic)
  const headers = [
    "الكود",
    "العنوان",
    "المالك",
    "الحالة",
    "الفئة",
    "تاريخ آخر مراجعة",
    "تاريخ المراجعة القادمة",
    "تاريخ الإنشاء",
    "تاريخ آخر تحديث",
  ];

  // Map status to Arabic
  const statusMap: Record<string, string> = {
    draft: "مسودة",
    active: "نشطة",
    archived: "مؤرشفة",
  };

  // Convert policies to CSV rows
  const rows = policies.map((policy) => [
    escapeCsvValue(policy.code),
    escapeCsvValue(policy.title),
    escapeCsvValue(policy.owner || "-"),
    escapeCsvValue(statusMap[policy.status] || policy.status),
    escapeCsvValue(policy.category || "-"),
    escapeCsvValue(policy.last_review_date || "-"),
    escapeCsvValue(policy.next_review_date || "-"),
    escapeCsvValue(formatDateTime(policy.created_at)),
    escapeCsvValue(formatDateTime(policy.updated_at)),
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  // Add BOM for proper UTF-8 encoding (for Arabic text in Excel)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Generate filename with current date
  const defaultFilename = `policies_export_${new Date().toISOString().split("T")[0]}.csv`;
  const finalFilename = filename || defaultFilename;

  // Create download link and trigger download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", finalFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV value to handle special characters
 */
function escapeCsvValue(value: string): string {
  if (!value) return '""';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return `"${value}"`;
}

/**
 * Format ISO date string to readable format
 */
function formatDateTime(isoString: string): string {
  if (!isoString) return "-";
  
  try {
    const date = new Date(isoString);
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return isoString;
  }
}
