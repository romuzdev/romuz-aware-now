/**
 * Import/Export Service
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Business logic for import/export operations across modules
 */

import {
  createImportExportJob,
  updateImportExportJob,
  listImportExportJobs,
  getImportExportJob,
  cancelImportExportJob,
  type ImportExportJob,
} from '@/lib/shared';

export type ExportOptions = {
  module_name: string;
  entity_type: string;
  file_format: 'csv' | 'json' | 'xlsx';
  filters?: any;
  columns?: string[];
  metadata?: any;
};

export type ImportOptions = {
  module_name: string;
  entity_type: string;
  file_format: 'csv' | 'json' | 'xlsx';
  file: File;
  mapping?: Record<string, string>;
  validate?: boolean;
  metadata?: any;
};

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], columns?: string[]): string {
  if (data.length === 0) return '';

  const keys = columns || Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(row => 
    keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Convert data to JSON format
 */
function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse CSV data
 */
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

/**
 * Export data to file
 */
export async function exportData(
  options: ExportOptions,
  dataFetchFn: () => Promise<any[]>
): Promise<{ job: ImportExportJob; downloadUrl: string }> {
  // Create job
  const job = await createImportExportJob({
    module_name: options.module_name,
    job_type: 'export',
    entity_type: options.entity_type,
    file_format: options.file_format,
    options: {
      filters: options.filters,
      columns: options.columns,
    },
    metadata: options.metadata,
  });

  try {
    // Update to processing
    await updateImportExportJob(job.id, { status: 'processing' });

    // Fetch data
    const data = await dataFetchFn();

    // Convert to requested format
    let fileContent: string;
    let mimeType: string;
    let fileExtension: string;

    switch (options.file_format) {
      case 'csv':
        fileContent = convertToCSV(data, options.columns);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        fileContent = convertToJSON(data);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      default:
        throw new Error(`Unsupported format: ${options.file_format}`);
    }

    // Create blob and download URL
    const blob = new Blob([fileContent], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    // Update job with success
    await updateImportExportJob(job.id, {
      status: 'completed',
      total_rows: data.length,
      processed_rows: data.length,
      success_rows: data.length,
      file_size_bytes: blob.size,
    });

    return { job, downloadUrl };
  } catch (error: any) {
    // Update job with failure
    await updateImportExportJob(job.id, {
      status: 'failed',
      error_log: [{ message: error.message, timestamp: new Date().toISOString() }],
    });

    throw error;
  }
}

/**
 * Import data from file
 */
export async function importData(
  options: ImportOptions,
  dataImportFn: (data: any[]) => Promise<void>
): Promise<ImportExportJob> {
  // Create job
  const job = await createImportExportJob({
    module_name: options.module_name,
    job_type: 'import',
    entity_type: options.entity_type,
    file_format: options.file_format,
    options: {
      mapping: options.mapping,
      validate: options.validate,
    },
    metadata: options.metadata,
  });

  try {
    // Update to processing
    await updateImportExportJob(job.id, { status: 'processing' });

    // Read file
    const fileText = await options.file.text();

    // Parse based on format
    let parsedData: any[];
    switch (options.file_format) {
      case 'csv':
        parsedData = parseCSV(fileText);
        break;
      case 'json':
        parsedData = JSON.parse(fileText);
        break;
      default:
        throw new Error(`Unsupported format: ${options.file_format}`);
    }

    // Update total rows
    await updateImportExportJob(job.id, { total_rows: parsedData.length });

    // Apply mapping if provided
    if (options.mapping) {
      parsedData = parsedData.map(row => {
        const mappedRow: any = {};
        Object.entries(options.mapping!).forEach(([source, target]) => {
          mappedRow[target] = row[source];
        });
        return mappedRow;
      });
    }

    // Import data
    await dataImportFn(parsedData);

    // Update job with success
    await updateImportExportJob(job.id, {
      status: 'completed',
      processed_rows: parsedData.length,
      success_rows: parsedData.length,
      file_size_bytes: options.file.size,
    });

    return job;
  } catch (error: any) {
    // Update job with failure
    await updateImportExportJob(job.id, {
      status: 'failed',
      error_log: [{ message: error.message, timestamp: new Date().toISOString() }],
    });

    throw error;
  }
}

/**
 * Get import/export history
 */
export async function getImportExportHistory(filters?: {
  module_name?: string;
  job_type?: string;
  limit?: number;
}) {
  return listImportExportJobs(filters);
}

/**
 * Get job details
 */
export async function getJobDetails(jobId: string) {
  return getImportExportJob(jobId);
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string) {
  return cancelImportExportJob(jobId);
}
