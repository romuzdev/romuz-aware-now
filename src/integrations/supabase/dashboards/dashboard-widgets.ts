/**
 * M14 - Dashboard Widgets Integration
 * Widget library and management
 */

import { supabase } from '../client';

export interface DashboardWidget {
  id: string;
  tenant_id: string;
  widget_type: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  config: Record<string, any>;
  data_source: string;
  query_config?: Record<string, any>;
  refresh_interval: number;
  icon?: string;
  category?: string;
  is_system: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWidgetInput {
  widget_type: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  config: Record<string, any>;
  data_source: string;
  query_config?: Record<string, any>;
  refresh_interval?: number;
  icon?: string;
  category?: string;
}

/**
 * Get all available widgets
 */
export async function getWidgets(
  category?: string,
  widgetType?: string
): Promise<DashboardWidget[]> {
  let query = supabase
    .from('dashboard_widgets')
    .select('*')
    .order('name_ar');

  if (category) {
    query = query.eq('category', category);
  }

  if (widgetType) {
    query = query.eq('widget_type', widgetType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get widget by ID
 */
export async function getWidget(id: string): Promise<DashboardWidget> {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create custom widget
 */
export async function createWidget(input: CreateWidgetInput): Promise<DashboardWidget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantData) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .insert({
      ...input,
      tenant_id: tenantData.tenant_id,
      created_by: user.id,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update widget
 */
export async function updateWidget(
  id: string,
  updates: Partial<CreateWidgetInput>
): Promise<DashboardWidget> {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .update(updates)
    .eq('id', id)
    .eq('is_system', false) // Only allow updating non-system widgets
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete widget
 */
export async function deleteWidget(id: string): Promise<void> {
  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', id)
    .eq('is_system', false); // Only allow deleting non-system widgets

  if (error) throw error;
}

/**
 * Get widget data (executes the query)
 */
export async function getWidgetData(widgetId: string): Promise<any> {
  // Check cache first
  const { data: cached } = await supabase
    .from('dashboard_widget_cache')
    .select('cached_data, expires_at')
    .eq('widget_id', widgetId)
    .maybeSingle();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return cached.cached_data;
  }

  // Get widget config
  const widget = await getWidget(widgetId);

  // Execute query based on data_source
  const data = await executeWidgetQuery(widget);

  // Cache the result
  const expiresAt = new Date(Date.now() + widget.refresh_interval * 1000);
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user?.id)
    .single();

  if (tenantData) {
    await supabase
      .from('dashboard_widget_cache')
      .upsert({
        widget_id: widgetId,
        tenant_id: tenantData.tenant_id,
        cached_data: data,
        expires_at: expiresAt.toISOString(),
        cached_at: new Date().toISOString(),
      });
  }

  return data;
}

/**
 * Execute widget query based on data source
 */
async function executeWidgetQuery(widget: DashboardWidget): Promise<any> {
  const { data_source, query_config } = widget;

  // Map data sources to tables
  const tableMap: Record<string, string> = {
    'risks': 'grc_risks',
    'policies': 'policies',
    'campaigns': 'awareness_campaigns',
    'audits': 'grc_audits',
    'documents': 'documents',
    'objectives': 'strategic_objectives',
  };

  const tableName = tableMap[data_source] || data_source;

  // Build query based on config
  let query = supabase.from(tableName).select(query_config?.select || '*');

  // Apply filters from query_config
  if (query_config?.filters) {
    Object.entries(query_config.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Apply aggregations
  if (query_config?.aggregate) {
    // Handle aggregations (count, sum, avg, etc.)
    const { data, error } = await query;
    if (error) throw error;
    
    // Apply aggregation logic
    return applyAggregation(data, query_config.aggregate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

/**
 * Apply aggregation to data
 */
function applyAggregation(data: any[], aggregateConfig: any): any {
  const { type, field } = aggregateConfig;

  switch (type) {
    case 'count':
      return { count: data.length };
    case 'sum':
      return { sum: data.reduce((acc, item) => acc + (item[field] || 0), 0) };
    case 'avg':
      const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
      return { avg: data.length > 0 ? sum / data.length : 0 };
    case 'max':
      return { max: Math.max(...data.map(item => item[field] || 0)) };
    case 'min':
      return { min: Math.min(...data.map(item => item[field] || 0)) };
    default:
      return data;
  }
}
