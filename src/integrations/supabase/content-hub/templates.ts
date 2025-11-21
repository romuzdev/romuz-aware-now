/**
 * M13.1 Content Hub - Templates Integration
 */

import { supabase } from '../client';

export interface ContentTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  content_type: string;
  structure: Record<string, any>;
  default_values?: Record<string, any>;
  ai_prompt_template?: string;
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content_type: string;
  structure: Record<string, any>;
  default_values?: Record<string, any>;
  ai_prompt_template?: string;
}

/**
 * Get all templates
 */
export async function getTemplates(contentType?: string): Promise<ContentTemplate[]> {
  let query = supabase
    .from('content_templates')
    .select('*')
    .eq('is_active', true)
    .order('usage_count', { ascending: false });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string): Promise<ContentTemplate> {
  const { data, error } = await supabase
    .from('content_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<ContentTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantData) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('content_templates')
    .insert({
      ...input,
      tenant_id: tenantData.tenant_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update template
 */
export async function updateTemplate(
  id: string,
  updates: Partial<CreateTemplateInput>
): Promise<ContentTemplate> {
  const { data, error } = await supabase
    .from('content_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('content_templates')
    .delete()
    .eq('id', id)
    .eq('is_system', false); // Only non-system templates can be deleted

  if (error) throw error;
}

/**
 * Increment template usage
 */
export async function incrementTemplateUsage(id: string) {
  const { error } = await supabase.rpc('increment', {
    table_name: 'content_templates',
    row_id: id,
    column_name: 'usage_count',
  });

  // If RPC doesn't exist, use regular update
  if (error) {
    const { data: template } = await supabase
      .from('content_templates')
      .select('usage_count')
      .eq('id', id)
      .single();

    if (template) {
      await supabase
        .from('content_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', id);
    }
  }
}
