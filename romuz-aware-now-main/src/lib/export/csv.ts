export function toCSV(rows: any[], headers?: Record<string, string>) {
  if (!rows || rows.length === 0) return '';
  const keys = headers ? Object.keys(headers) : Object.keys(rows[0]);
  const head = headers ? keys.map(k => headers[k]) : keys;
  const lines = [
    head.join(','),
    ...rows.map(r => keys.map(k => {
      const v = r[k] ?? '';
      const escaped = String(v).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ];
  return lines.join('\n');
}
