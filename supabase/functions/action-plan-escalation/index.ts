// ============================================================================
// Action Plan Escalation Edge Function
// Automatically escalates overdue action plans to managers
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Milestone {
  id: string;
  action_id: string;
  title_ar: string;
  planned_date: string;
  status: string;
  tenant_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("⚠️ Starting action plan escalation check...");

    // Calculate escalation threshold (7 days overdue)
    const escalationDate = new Date();
    escalationDate.setDate(escalationDate.getDate() - 7);
    const escalationDateStr = escalationDate.toISOString().split("T")[0];

    // Find overdue milestones that need escalation
    const { data: overdueMilestones, error: milestonesError } = await supabaseClient
      .from("action_plan_milestones")
      .select("id, action_id, title_ar, planned_date, status, tenant_id")
      .lt("planned_date", escalationDateStr)
      .in("status", ["pending", "in_progress", "delayed"])
      .order("planned_date", { ascending: true });

    if (milestonesError) {
      console.error("Error fetching overdue milestones:", milestonesError);
      throw milestonesError;
    }

    if (!overdueMilestones || overdueMilestones.length === 0) {
      console.log("✅ No overdue milestones requiring escalation");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No escalations needed",
          count: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`🚨 Found ${overdueMilestones.length} milestones requiring escalation`);

    // Check if escalation notification already exists for each milestone
    const escalations = [];
    for (const milestone of overdueMilestones) {
      // Check for existing escalation notification
      const { data: existingEscalation } = await supabaseClient
        .from("action_plan_notifications")
        .select("id")
        .eq("action_id", milestone.action_id)
        .eq("notification_type", "escalation")
        .contains("metadata", { milestone_id: milestone.id })
        .maybeSingle();

      if (existingEscalation) {
        console.log(`⏭️ Escalation already exists for milestone: ${milestone.title_ar}`);
        continue;
      }

      // Get action details and responsible users
      const { data: action, error: actionError } = await supabaseClient
        .from("action_plans")
        .select("responsible_user_id, title_ar, owner_id")
        .eq("id", milestone.action_id)
        .single();

      if (actionError || !action) {
        console.error(`Error fetching action ${milestone.action_id}:`, actionError);
        continue;
      }

      // Calculate days overdue
      const today = new Date();
      const dueDate = new Date(milestone.planned_date);
      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine recipient users (owner + responsible)
      const recipientUserIds = [];
      if (action.owner_id) recipientUserIds.push(action.owner_id);
      if (action.responsible_user_id && action.responsible_user_id !== action.owner_id) {
        recipientUserIds.push(action.responsible_user_id);
      }

      // Create escalation notification
      const escalation = {
        action_id: milestone.action_id,
        notification_type: "escalation",
        severity: daysOverdue > 14 ? "critical" : "warning",
        title_ar: `تصعيد: معلم متأخر - ${milestone.title_ar}`,
        message_ar: `المعلم "${milestone.title_ar}" للإجراء "${action.title_ar}" متأخر بـ ${daysOverdue} يوم. يتطلب الأمر اهتماماً فورياً.`,
        recipient_user_ids: recipientUserIds,
        delivery_channels: ["email", "in_app"],
        trigger_condition: {
          milestone_id: milestone.id,
          days_overdue: daysOverdue,
        },
        metadata: {
          milestone_id: milestone.id,
          milestone_title: milestone.title_ar,
          due_date: milestone.planned_date,
          days_overdue: daysOverdue,
          automation_type: "escalation",
        },
        tenant_id: milestone.tenant_id,
      };

      const { data: createdEscalation, error: escalationError } =
        await supabaseClient
          .from("action_plan_notifications")
          .insert(escalation)
          .select()
          .single();

      if (escalationError) {
        console.error("Error creating escalation:", escalationError);
      } else {
        // Update milestone status to 'delayed' if not already
        if (milestone.status !== "delayed") {
          await supabaseClient
            .from("action_plan_milestones")
            .update({ status: "delayed" })
            .eq("id", milestone.id);
        }

        escalations.push(createdEscalation);
        console.log(`✅ Created escalation for milestone: ${milestone.title_ar} (${daysOverdue} days overdue)`);
      }
    }

    console.log(`🎉 Successfully created ${escalations.length} escalations`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${escalations.length} escalations`,
        count: escalations.length,
        escalations,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in action-plan-escalation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
