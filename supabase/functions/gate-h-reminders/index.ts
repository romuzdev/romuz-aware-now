// ============================================================================
// Gate-H Reminders Edge Function
// Daily cron job to send reminders for due soon, overdue, and SLA breach actions
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// Configuration Constants
// ============================================================
const DUE_SOON_DAYS = 3; // Actions due in the next 3 days
const MAX_ACTIONS_PER_RUN = 1000; // Safeguard limit
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'; // System user for auto-comments

// Reminder messages in Arabic
const REMINDER_MESSAGES = {
  due_soon: 'تنبيه آلي: هذا الإجراء يقترب من تاريخ الاستحقاق خلال الأيام القادمة.',
  overdue: 'تنبيه آلي: هذا الإجراء تجاوز تاريخ الاستحقاق ولم يتم إغلاقه بعد.',
  sla_breach: 'تنبيه آلي: تم تجاوز مهلة SLA المحددة لهذا الإجراء دون إغلاق.',
};

// ============================================================
// Type Definitions
// ============================================================
type ReminderKind = 'due_soon' | 'overdue' | 'sla_breach';

interface ActionItem {
  id: string;
  tenant_id: string;
  title_ar: string;
  status: string;
  due_date: string | null;
  sla_days: number | null;
  created_at: string;
}

interface ReminderStats {
  tenantsProcessed: number;
  dueSoonCount: number;
  overdueCount: number;
  slaBreachCount: number;
  totalReminders: number;
  errors: string[];
}

// ============================================================
// Main Handler
// ============================================================
serve(async (req) => {
  console.log('[gate-h-reminders] Starting daily reminder job');
  
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
    
    // Process reminders
    const stats = await processReminders(supabase);
    
    console.log('[gate-h-reminders] Job completed successfully:', stats);
    
    return new Response(
      JSON.stringify({
        ok: true,
        ...stats,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[gate-h-reminders] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================
// Core Processing Logic
// ============================================================
async function processReminders(supabase: any): Promise<ReminderStats> {
  const stats: ReminderStats = {
    tenantsProcessed: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    slaBreachCount: 0,
    totalReminders: 0,
    errors: [],
  };
  
  // 1) Fetch distinct tenants with open actions
  console.log('[gate-h-reminders] Fetching tenants with open actions');
  
  const { data: tenantRows, error: tenantError } = await supabase
    .from('gate_h.action_items')
    .select('tenant_id')
    .neq('status', 'closed')
    .not('tenant_id', 'is', null)
    .limit(500);
  
  if (tenantError) {
    throw new Error(`Failed to fetch tenants: ${tenantError.message}`);
  }
  
  const tenantIds: string[] = Array.from(
    new Set((tenantRows ?? []).map((t: any) => t.tenant_id as string))
  ).filter((id): id is string => typeof id === 'string' && id !== null);
  
  console.log(`[gate-h-reminders] Found ${tenantIds.length} tenants to process`);
  
  // 2) Process each tenant
  for (const tenantId of tenantIds) {
    try {
      const tenantStats = await processTenantReminders(supabase, tenantId);
      
      stats.dueSoonCount += tenantStats.dueSoonCount;
      stats.overdueCount += tenantStats.overdueCount;
      stats.slaBreachCount += tenantStats.slaBreachCount;
      stats.totalReminders += tenantStats.totalReminders;
      stats.tenantsProcessed++;
      
      console.log(`[gate-h-reminders] Tenant ${tenantId}: ${tenantStats.totalReminders} reminders sent`);
    } catch (error) {
      const errorMsg = `Tenant ${tenantId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[gate-h-reminders] Error processing tenant:`, errorMsg);
      stats.errors.push(errorMsg);
    }
  }
  
  return stats;
}

// ============================================================
// Process Single Tenant
// ============================================================
async function processTenantReminders(
  supabase: any,
  tenantId: string
): Promise<ReminderStats> {
  const stats: ReminderStats = {
    tenantsProcessed: 1,
    dueSoonCount: 0,
    overdueCount: 0,
    slaBreachCount: 0,
    totalReminders: 0,
    errors: [],
  };
  
  // Calculate dates
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const dueSoonDate = new Date(today);
  dueSoonDate.setDate(dueSoonDate.getDate() + DUE_SOON_DAYS);
  const dueSoonIso = dueSoonDate.toISOString().slice(0, 10);
  
  // 1) Fetch due soon actions
  const { data: dueSoonActions, error: dueSoonError } = await supabase
    .from('gate_h.action_items')
    .select('id, tenant_id, title_ar, status, due_date, sla_days, created_at')
    .eq('tenant_id', tenantId)
    .in('status', ['new', 'in_progress', 'blocked'])
    .not('due_date', 'is', null)
    .gte('due_date', todayIso)
    .lte('due_date', dueSoonIso)
    .limit(MAX_ACTIONS_PER_RUN);
  
  if (dueSoonError) {
    throw new Error(`Due soon query failed: ${dueSoonError.message}`);
  }
  
  // 2) Fetch overdue actions
  const { data: overdueActions, error: overdueError } = await supabase
    .from('gate_h.action_items')
    .select('id, tenant_id, title_ar, status, due_date, sla_days, created_at')
    .eq('tenant_id', tenantId)
    .neq('status', 'closed')
    .not('due_date', 'is', null)
    .lt('due_date', todayIso)
    .limit(MAX_ACTIONS_PER_RUN);
  
  if (overdueError) {
    throw new Error(`Overdue query failed: ${overdueError.message}`);
  }
  
  // 3) Fetch SLA breach actions
  // Note: Using current timestamp for SLA calculation
  const { data: slaBreachActions, error: slaError } = await supabase
    .rpc('gate_h_get_sla_breach_actions', {
      p_tenant_id: tenantId,
      p_limit: MAX_ACTIONS_PER_RUN,
    })
    .catch(() => {
      // If RPC doesn't exist, query manually
      return supabase
        .from('gate_h.action_items')
        .select('id, tenant_id, title_ar, status, due_date, sla_days, created_at')
        .eq('tenant_id', tenantId)
        .neq('status', 'closed')
        .not('sla_days', 'is', null)
        .limit(MAX_ACTIONS_PER_RUN);
    });
  
  if (slaError && !slaBreachActions) {
    console.warn(`[gate-h-reminders] SLA breach query failed (non-fatal): ${slaError?.message}`);
  }
  
  // Filter SLA breach actions client-side if needed
  const filteredSlaActions = (slaBreachActions?.data ?? slaBreachActions ?? []).filter((action: ActionItem) => {
    if (!action.sla_days || !action.created_at) return false;
    const createdDate = new Date(action.created_at);
    const breachDate = new Date(createdDate);
    breachDate.setDate(breachDate.getDate() + action.sla_days);
    return breachDate < today;
  });
  
  // Process reminders for each category
  stats.dueSoonCount = await processActionReminders(
    supabase,
    dueSoonActions ?? [],
    'due_soon',
    todayIso
  );
  
  stats.overdueCount = await processActionReminders(
    supabase,
    overdueActions ?? [],
    'overdue',
    todayIso
  );
  
  stats.slaBreachCount = await processActionReminders(
    supabase,
    filteredSlaActions,
    'sla_breach',
    todayIso
  );
  
  stats.totalReminders = stats.dueSoonCount + stats.overdueCount + stats.slaBreachCount;
  
  return stats;
}

// ============================================================
// Process Action Reminders (Check Log + Insert)
// ============================================================
async function processActionReminders(
  supabase: any,
  actions: ActionItem[],
  kind: ReminderKind,
  reminderDate: string
): Promise<number> {
  let count = 0;
  
  for (const action of actions) {
    try {
      // Check if reminder already sent today
      const { data: existingLog, error: logCheckError } = await supabase
        .from('gate_h.action_reminder_log')
        .select('id')
        .eq('tenant_id', action.tenant_id)
        .eq('action_id', action.id)
        .eq('kind', kind)
        .eq('reminder_date', reminderDate)
        .maybeSingle();
      
      if (logCheckError) {
        console.error(`[gate-h-reminders] Log check error for action ${action.id}:`, logCheckError);
        continue;
      }
      
      if (existingLog) {
        // Already reminded today, skip
        continue;
      }
      
      // Insert reminder log
      const { error: logInsertError } = await supabase
        .from('gate_h.action_reminder_log')
        .insert({
          tenant_id: action.tenant_id,
          action_id: action.id,
          kind: kind,
          reminder_date: reminderDate,
        });
      
      if (logInsertError) {
        console.error(`[gate-h-reminders] Failed to insert reminder log for action ${action.id}:`, logInsertError);
        continue;
      }
      
      // Insert system comment update
      const { error: updateInsertError } = await supabase
        .from('gate_h.action_updates')
        .insert({
          tenant_id: action.tenant_id,
          action_id: action.id,
          update_type: 'comment',
          body_ar: REMINDER_MESSAGES[kind],
          created_by: SYSTEM_USER_ID,
        });
      
      if (updateInsertError) {
        console.error(`[gate-h-reminders] Failed to insert update for action ${action.id}:`, updateInsertError);
        // Continue anyway since log was inserted
      }
      
      count++;
    } catch (error) {
      console.error(`[gate-h-reminders] Unexpected error processing action ${action.id}:`, error);
    }
  }
  
  return count;
}

console.log('[gate-h-reminders] Edge function loaded and ready');
