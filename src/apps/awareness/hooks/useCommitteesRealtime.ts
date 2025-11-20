/**
 * Committees Realtime Hook
 * Gate-K: D4 Upgrade - D1 Standard
 * 
 * Manages real-time updates for Committees using Supabase Realtime
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for real-time updates on committees table
 * 
 * Features:
 * - Listens to INSERT, UPDATE, DELETE events
 * - Automatically invalidates React Query cache
 * - Shows toast notifications for changes
 * - Handles subscription lifecycle
 */
export function useCommitteesRealtime(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;

    console.log('[useCommitteesRealtime] Setting up realtime subscription...');

    // Subscribe to committees table changes
    const channel = supabase
      .channel('committees-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'committees',
        },
        (payload) => {
          console.log('[useCommitteesRealtime] INSERT event:', payload);
          
          // Invalidate committees list
          queryClient.invalidateQueries({ queryKey: ['committees'] });
          
          toast({
            title: 'لجنة جديدة',
            description: `تمت إضافة لجنة جديدة: ${payload.new.name || payload.new.code}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'committees',
        },
        (payload) => {
          console.log('[useCommitteesRealtime] UPDATE event:', payload);
          
          // Invalidate committees list and specific committee
          queryClient.invalidateQueries({ queryKey: ['committees'] });
          queryClient.invalidateQueries({ queryKey: ['committee', payload.new.id] });
          
          toast({
            title: 'تحديث لجنة',
            description: `تم تحديث لجنة: ${payload.new.name || payload.new.code}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'committees',
        },
        (payload) => {
          console.log('[useCommitteesRealtime] DELETE event:', payload);
          
          // Invalidate committees list
          queryClient.invalidateQueries({ queryKey: ['committees'] });
          
          toast({
            title: 'حذف لجنة',
            description: `تم حذف لجنة: ${payload.old.name || payload.old.code}`,
            variant: 'destructive',
          });
        }
      )
      .subscribe((status) => {
        console.log('[useCommitteesRealtime] Subscription status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('[useCommitteesRealtime] Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, toast]);
}
