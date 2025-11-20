// ============================================================================
// Gate-H: Automation Integration Layer
// ============================================================================

import { supabase } from "@/integrations/supabase/client";

// ============================================================
// Roadmap Compatibility: Automate Reminders
// ============================================================

/**
 * Trigger automated reminders for action plan milestones
 * Calls the edge function to check and send reminders for upcoming milestones
 * @param planId - Action plan ID (action_id)
 */
export async function automateReminders(planId: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "action-plan-reminders",
      {
        body: { actionId: planId },
      }
    );

    if (error) {
      console.error("automateReminders error:", error);
      throw new Error(`فشل تشغيل التذكيرات التلقائية: ${error.message}`);
    }

    console.log("✅ Reminders automation triggered successfully:", data);
  } catch (error) {
    console.error("automateReminders exception:", error);
    throw error;
  }
}

/**
 * Trigger automated escalation for overdue action plans
 * Calls the edge function to check and escalate delayed milestones
 * @param planId - Action plan ID (action_id)
 */
export async function automateEscalation(planId: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "action-plan-escalation",
      {
        body: { actionId: planId },
      }
    );

    if (error) {
      console.error("automateEscalation error:", error);
      throw new Error(`فشل تشغيل التصعيد التلقائي: ${error.message}`);
    }

    console.log("✅ Escalation automation triggered successfully:", data);
  } catch (error) {
    console.error("automateEscalation exception:", error);
    throw error;
  }
}
