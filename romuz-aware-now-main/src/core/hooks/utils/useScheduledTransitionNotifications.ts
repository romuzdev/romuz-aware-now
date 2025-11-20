import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduledTransitions } from "@/core/tenancy/integration";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Notification thresholds in milliseconds
const NOTIFICATION_THRESHOLDS = {
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,  // 30 days
  THREE_DAYS: 3 * 24 * 60 * 60 * 1000,    // 3 days
  ONE_DAY: 24 * 60 * 60 * 1000,            // 24 hours
};

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

type NotificationLevel = '30_days' | '3_days' | '1_day';

export function useScheduledTransitionNotifications(tenantId?: string) {
  const { toast } = useToast();
  // Track which transitions have been notified at which levels
  const notifiedTransitions = useRef<Map<string, Set<NotificationLevel>>>(new Map());

  const { data: transitions } = useQuery({
    queryKey: ['scheduled-transitions-notifications', tenantId],
    queryFn: () => fetchScheduledTransitions(tenantId, 'pending'),
    refetchInterval: CHECK_INTERVAL_MS,
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (!transitions || transitions.length === 0) return;

    const now = new Date();

    transitions.forEach((transition) => {
      const scheduledTime = new Date(transition.scheduled_at);
      const timeUntilExecution = scheduledTime.getTime() - now.getTime();

      // Skip if in the past
      if (timeUntilExecution <= 0) return;

      // Get or create notification set for this transition
      if (!notifiedTransitions.current.has(transition.id)) {
        notifiedTransitions.current.set(transition.id, new Set());
      }
      const notifiedLevels = notifiedTransitions.current.get(transition.id)!;

      // Check 30 days notification
      if (
        timeUntilExecution <= NOTIFICATION_THRESHOLDS.THIRTY_DAYS &&
        timeUntilExecution > NOTIFICATION_THRESHOLDS.THREE_DAYS &&
        !notifiedLevels.has('30_days')
      ) {
        toast({
          title: "📅 Early Warning: Scheduled Transition",
          description: `Tenant will transition from ${transition.from_state} to ${transition.to_state} in 30 days${transition.reason ? `\nReason: ${transition.reason}` : ''}`,
          duration: 15000,
        });
        notifiedLevels.add('30_days');
      }

      // Check 3 days notification
      if (
        timeUntilExecution <= NOTIFICATION_THRESHOLDS.THREE_DAYS &&
        timeUntilExecution > NOTIFICATION_THRESHOLDS.ONE_DAY &&
        !notifiedLevels.has('3_days')
      ) {
        const timeRemaining = formatDistanceToNow(scheduledTime, { 
          addSuffix: true 
        });
        
        toast({
          title: "⚠️ Alert: Scheduled Transition Soon",
          description: `Tenant will transition from ${transition.from_state} to ${transition.to_state} ${timeRemaining}${transition.reason ? `\nReason: ${transition.reason}` : ''}`,
          duration: 12000,
        });
        notifiedLevels.add('3_days');
      }

      // Check 24 hours notification
      if (
        timeUntilExecution <= NOTIFICATION_THRESHOLDS.ONE_DAY &&
        !notifiedLevels.has('1_day')
      ) {
        const timeRemaining = formatDistanceToNow(scheduledTime, { 
          addSuffix: true 
        });
        
        toast({
          title: "🚨 Urgent Alert: Transition Scheduled Within 24 Hours",
          description: `Tenant will transition from ${transition.from_state} to ${transition.to_state} ${timeRemaining}${transition.reason ? `\nReason: ${transition.reason}` : ''}`,
          duration: 10000,
          variant: "destructive",
        });
        notifiedLevels.add('1_day');
      }
    });
  }, [transitions, toast]);

  // Cleanup old notifications from memory
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (transitions) {
        const currentIds = new Set(transitions.map(t => t.id));
        notifiedTransitions.current.forEach((_, id) => {
          if (!currentIds.has(id)) {
            notifiedTransitions.current.delete(id);
          }
        });
      }
    }, 60 * 60 * 1000); // Cleanup every hour

    return () => clearInterval(cleanup);
  }, [transitions]);
}
