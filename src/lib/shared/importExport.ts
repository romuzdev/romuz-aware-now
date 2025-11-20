/**
 * Import/Export Integration Layer
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Provides database operations for import_export_jobs table
 */

import { supabase } from '@/integrations/supabase/client';

export type ImportExportJob = {
  id: string;
  tenant_id: string;
  user_id: string;
  module_name: string;
  job_type: 'import' | 'export';
  entity_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  file_format: 'csv' | 'json' | 'xlsx';
  file_path?: string;
  file_size_bytes?: number;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  failed_rows: number;
  error_log: any[];
  options: any;
  metadata: any;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Create a new import/export job
 */
export async function createImportExportJob(params: {
  module_name: string;
  job_type: ImportExportJob['job_type'];
  entity_type: string;
  file_format: ImportExportJob['file_format'];
  options?: any;
  metadata?: any;
}) {
  const { data, error } = await supabase
    .from('import_export_jobs')
    .insert({
      module_name: params.module_name,
      job_type: params.job_type,
      entity_type: params.entity_type,
      file_format: params.file_format,
      options: params.options || {},
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as ImportExportJob;
}

/**
 * Update import/export job status and progress
 */
export async function updateImportExportJob(
  id: string,
  updates: {
    status?: ImportExportJob['status'];
    file_path?: string;
    file_size_bytes?: number;
    total_rows?: number;
    processed_rows?: number;
    success_rows?: number;
    failed_rows?: number;
    error_log?: any[];
    metadata?: any;
  }
) {
  const updateData: any = { ...updates };
  
  if (updates.status === 'processing' && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  }
  
  if (updates.status === 'completed' || updates.status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('import_export_jobs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ImportExportJob;
}

/**
 * List import/export jobs with filters
 */
export async function listImportExportJobs(filters?: {
  module_name?: string;
  job_type?: string;
  status?: string;
  limit?: number;
}) {
  let query = supabase
    .from('import_export_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.module_name) {
    query = query.eq('module_name', filters.module_name);
  }
  if (filters?.job_type) {
    query = query.eq('job_type', filters.job_type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ImportExportJob[];
}

/**
 * Get single import/export job by ID
 */
export async function getImportExportJob(id: string) {
  const { data, error } = await supabase
    .from('import_export_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ImportExportJob;
}

/**
 * Cancel an import/export job
 */
export async function cancelImportExportJob(id: string) {
  const { data, error } = await supabase
    .from('import_export_jobs')
    .update({ 
      status: 'cancelled',
      completed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ImportExportJob;
}

/**
 * Delete old import/export jobs (cleanup)
 */
export async function deleteImportExportJobs(olderThanDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { error } = await supabase
    .from('import_export_jobs')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (error) throw error;
}
