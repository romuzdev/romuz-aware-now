/**
 * M14 - Export Utilities for KPI Dashboard
 * PDF and Excel export functionality
 */

import type { UnifiedKPI, ModuleKPIGroup, KPIAlert } from '../types/unified-kpis.types';

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export KPIs to CSV
 */
export function exportKPIsToCSV(kpis: UnifiedKPI[]): void {
  const data = kpis.map(kpi => ({
    'Module': kpi.module,
    'KPI Name': kpi.kpi_name,
    'Entity': kpi.entity_name,
    'Current Value': kpi.current_value,
    'Target Value': kpi.target_value,
    'Status': kpi.status,
    'Achievement Rate': ((kpi.current_value / kpi.target_value) * 100).toFixed(2) + '%',
    'Last Updated': new Date(kpi.last_updated).toLocaleString('ar-SA')
  }));

  exportToCSV(data, 'kpi_dashboard');
}

/**
 * Export module groups to CSV
 */
export function exportModuleGroupsToCSV(groups: ModuleKPIGroup[]): void {
  const data = groups.map(group => ({
    'Module': group.moduleName,
    'Total KPIs': group.totalKPIs,
    'Avg Performance': group.avgPerformance.toFixed(2),
    'Avg Target': group.avgTarget.toFixed(2),
    'Achievement Rate': group.achievementRate.toFixed(2) + '%',
    'Critical Count': group.criticalCount
  }));

  exportToCSV(data, 'kpi_modules_summary');
}

/**
 * Export alerts to CSV
 */
export function exportAlertsToCSV(alerts: KPIAlert[]): void {
  const data = alerts.map(alert => ({
    'Module': alert.module,
    'KPI Name': alert.kpi_name,
    'Alert Type': alert.alert_type,
    'Severity': alert.severity,
    'Message': alert.message,
    'Current Value': alert.current_value,
    'Threshold Value': alert.threshold_value,
    'Status': alert.is_acknowledged ? 'Acknowledged' : 'Pending',
    'Created At': new Date(alert.created_at).toLocaleString('ar-SA')
  }));

  exportToCSV(data, 'kpi_alerts');
}

/**
 * Prepare data for PDF export
 * Returns formatted HTML that can be converted to PDF using browser print
 */
export function preparePDFContent(
  groups: ModuleKPIGroup[],
  alerts: KPIAlert[]
): string {
  const now = new Date().toLocaleString('ar-SA');
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير لوحة المؤشرات الموحدة</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          padding: 20px;
        }
        h1 {
          color: #1e40af;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        h2 {
          color: #374151;
          margin-top: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 10px;
          text-align: right;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .critical {
          color: #dc2626;
          font-weight: bold;
        }
        .success {
          color: #16a34a;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>تقرير لوحة المؤشرات الموحدة</h1>
      <p><strong>تاريخ التقرير:</strong> ${now}</p>
      
      <h2>ملخص الموديولات</h2>
      <table>
        <thead>
          <tr>
            <th>الموديول</th>
            <th>عدد المؤشرات</th>
            <th>معدل الإنجاز</th>
            <th>المؤشرات الحرجة</th>
          </tr>
        </thead>
        <tbody>
          ${groups.map(g => `
            <tr>
              <td>${g.moduleName}</td>
              <td>${g.totalKPIs}</td>
              <td class="${g.achievementRate >= 80 ? 'success' : ''}">${g.achievementRate.toFixed(2)}%</td>
              <td class="${g.criticalCount > 0 ? 'critical' : ''}">${g.criticalCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>التنبيهات النشطة</h2>
      <table>
        <thead>
          <tr>
            <th>الموديول</th>
            <th>المؤشر</th>
            <th>الخطورة</th>
            <th>الرسالة</th>
          </tr>
        </thead>
        <tbody>
          ${alerts.slice(0, 20).map(a => `
            <tr>
              <td>${a.module}</td>
              <td>${a.kpi_name}</td>
              <td class="${a.severity === 'critical' ? 'critical' : ''}">${a.severity}</td>
              <td>${a.message}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>تم إنشاء هذا التقرير تلقائياً من نظام Romuz Awareness</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export to PDF using browser print
 */
export function exportToPDF(
  groups: ModuleKPIGroup[],
  alerts: KPIAlert[]
): void {
  const content = preparePDFContent(groups, alerts);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
