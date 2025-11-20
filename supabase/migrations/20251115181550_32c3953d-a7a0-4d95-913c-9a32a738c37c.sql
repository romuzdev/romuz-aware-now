
-- ============================================================================
-- Event System Phase 1: Final Fix - Enable Realtime on event_execution_log
-- ============================================================================

-- Enable Realtime for event_execution_log table
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_execution_log;

-- Add comment for tracking
COMMENT ON TABLE public.event_execution_log IS 'Event execution log with Realtime enabled for live monitoring';
