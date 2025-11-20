/**
 * Gate-P Export Utilities
 * Export data to JSON and CSV formats
 */

/**
 * Export data as JSON file
 */
export function exportJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { 
    href: url, 
    download: filename 
  });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file
 */
export function exportCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows.length) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => 
      headers.map(h => {
        const value = r[h] ?? '';
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { 
    href: url, 
    download: filename 
  });
  a.click();
  URL.revokeObjectURL(url);
}
