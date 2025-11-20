// ============================================================================
// Action Plan Reminders Edge Function
// Automatically sends reminders for upcoming action plan milestones
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

    console.log("🔔 Starting action plan reminders check...");

    // Calculate reminder date (3 days from now)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);
    const reminderDateStr = reminderDate.toISOString().split("T")[0];

    // Find milestones that are due in 3 days and not completed
    const { data: upcomingMilestones, error: milestonesError } = await supabaseClient
      .from("action_plan_milestones")
      .select("id, action_id, title_ar, planned_date, status, tenant_id")
      .eq("planned_date", reminderDateStr)
      .in("status", ["pending", "in_progress"])
      .order("planned_date", { ascending: true });

    if (milestonesError) {
      console.error("Error fetching milestones:", milestonesError);
      throw milestonesError;
    }

    if (!upcomingMilestones || upcomingMilestones.length === 0) {
      console.log("✅ No upcoming milestones requiring reminders");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No reminders needed",
          count: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`📋 Found ${upcomingMilestones.length} milestones requiring reminders`);

    // Create notifications for each upcoming milestone
    const notifications = [];
    for (const milestone of upcomingMilestones) {
      // Get action details to find responsible users
      const { data: action, error: actionError } = await supabaseClient
        .from("action_plans")
        .select("responsible_user_id, title_ar")
        .eq("id", milestone.action_id)
        .single();

      if (actionError || !action) {
        console.error(`Error fetching action ${milestone.action_id}:`, actionError);
        continue;
      }

      // Create notification
      const notification = {
        action_id: milestone.action_id,
        notification_type: "reminder",
        severity: "info",
        title_ar: `تذكير: معلم قادم - ${milestone.title_ar}`,
        message_ar: `المعلم "${milestone.title_ar}" للإجراء "${action.title_ar}" مستحق في ${new Date(milestone.planned_date).toLocaleDateString("ar-SA")}`,
        recipient_user_ids: action.responsible_user_id ? [action.responsible_user_id] : [],
        delivery_channels: ["email", "in_app"],
        trigger_condition: {
          milestone_id: milestone.id,
          days_before: 3,
        },
        metadata: {
          milestone_id: milestone.id,
          milestone_title: milestone.title_ar,
          due_date: milestone.planned_date,
          automation_type: "reminder",
        },
        tenant_id: milestone.tenant_id,
      };

      const { data: createdNotification, error: notificationError } =
        await supabaseClient
          .from("action_plan_notifications")
          .insert(notification)
          .select()
          .single();

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      } else {
        notifications.push(createdNotification);
        console.log(`✅ Created reminder for milestone: ${milestone.title_ar}`);
      }
    }

    console.log(`🎉 Successfully created ${notifications.length} reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${notifications.length} reminders`,
        count: notifications.length,
        notifications,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in action-plan-reminders:", error);
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
