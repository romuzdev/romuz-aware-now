-- ============================================================================
-- M18: Database Functions for Incident Automation
-- ============================================================================

-- Function: Calculate Incident Metrics
-- Calculates and updates metrics for an incident
CREATE OR REPLACE FUNCTION calculate_incident_metrics(p_incident_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incident RECORD;
  v_time_to_acknowledge INTERVAL;
  v_time_to_contain INTERVAL;
  v_time_to_resolve INTERVAL;
  v_response_time_hours NUMERIC;
  v_containment_time_hours NUMERIC;
  v_resolution_time_hours NUMERIC;
BEGIN
  -- Get incident details
  SELECT * INTO v_incident
  FROM security_incidents
  WHERE id = p_incident_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Incident not found: %', p_incident_id;
  END IF;

  -- Calculate time metrics
  IF v_incident.acknowledged_at IS NOT NULL THEN
    v_time_to_acknowledge := v_incident.acknowledged_at - v_incident.detected_at;
    v_response_time_hours := EXTRACT(EPOCH FROM v_time_to_acknowledge) / 3600.0;
  END IF;

  IF v_incident.contained_at IS NOT NULL THEN
    v_time_to_contain := v_incident.contained_at - v_incident.detected_at;
    v_containment_time_hours := EXTRACT(EPOCH FROM v_time_to_contain) / 3600.0;
  END IF;

  IF v_incident.resolved_at IS NOT NULL THEN
    v_time_to_resolve := v_incident.resolved_at - v_incident.detected_at;
    v_resolution_time_hours := EXTRACT(EPOCH FROM v_time_to_resolve) / 3600.0;
  END IF;

  -- Insert or update metrics
  INSERT INTO incident_metrics (
    incident_id,
    tenant_id,
    response_time_hours,
    containment_time_hours,
    resolution_time_hours,
    escalation_count,
    reassignment_count
  )
  VALUES (
    p_incident_id,
    v_incident.tenant_id,
    v_response_time_hours,
    v_containment_time_hours,
    v_resolution_time_hours,
    COALESCE(v_incident.escalation_count, 0),
    COALESCE(v_incident.reassignment_count, 0)
  )
  ON CONFLICT (incident_id) 
  DO UPDATE SET
    response_time_hours = EXCLUDED.response_time_hours,
    containment_time_hours = EXCLUDED.containment_time_hours,
    resolution_time_hours = EXCLUDED.resolution_time_hours,
    escalation_count = EXCLUDED.escalation_count,
    reassignment_count = EXCLUDED.reassignment_count,
    updated_at = NOW();
END;
$$;

-- Function: Escalate Incident
-- Escalates an incident based on severity and response time
CREATE OR REPLACE FUNCTION escalate_incident(p_incident_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incident RECORD;
  v_time_since_detection INTERVAL;
  v_should_escalate BOOLEAN := FALSE;
  v_escalation_reason TEXT;
  v_result JSONB;
BEGIN
  -- Get incident details
  SELECT * INTO v_incident
  FROM security_incidents
  WHERE id = p_incident_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Incident not found: %', p_incident_id;
  END IF;

  -- Calculate time since detection
  v_time_since_detection := NOW() - v_incident.detected_at;

  -- Determine if escalation is needed based on severity and time
  IF v_incident.status NOT IN ('closed', 'resolved') THEN
    CASE v_incident.severity
      WHEN 'critical' THEN
        -- Critical: escalate if not acknowledged within 15 minutes
        IF v_incident.acknowledged_at IS NULL AND 
           EXTRACT(EPOCH FROM v_time_since_detection) > 900 THEN
          v_should_escalate := TRUE;
          v_escalation_reason := 'Critical incident not acknowledged within 15 minutes';
        -- Or if not contained within 1 hour
        ELSIF v_incident.contained_at IS NULL AND 
              EXTRACT(EPOCH FROM v_time_since_detection) > 3600 THEN
          v_should_escalate := TRUE;
          v_escalation_reason := 'Critical incident not contained within 1 hour';
        END IF;

      WHEN 'high' THEN
        -- High: escalate if not acknowledged within 30 minutes
        IF v_incident.acknowledged_at IS NULL AND 
           EXTRACT(EPOCH FROM v_time_since_detection) > 1800 THEN
          v_should_escalate := TRUE;
          v_escalation_reason := 'High severity incident not acknowledged within 30 minutes';
        -- Or if not contained within 4 hours
        ELSIF v_incident.contained_at IS NULL AND 
              EXTRACT(EPOCH FROM v_time_since_detection) > 14400 THEN
          v_should_escalate := TRUE;
          v_escalation_reason := 'High severity incident not contained within 4 hours';
        END IF;

      WHEN 'medium' THEN
        -- Medium: escalate if not acknowledged within 2 hours
        IF v_incident.acknowledged_at IS NULL AND 
           EXTRACT(EPOCH FROM v_time_since_detection) > 7200 THEN
          v_should_escalate := TRUE;
          v_escalation_reason := 'Medium severity incident not acknowledged within 2 hours';
        END IF;

      ELSE
        -- Low: escalate if not acknowledged within 24 hours
        IF v_incident.acknowledged_at IS NULL AND 
           EXTRACT(EPOCH FROM v_time_since_detection) > 86400 THEN
          v_should_escalate := TRUE;
          v_escalation_reason := 'Low severity incident not acknowledged within 24 hours';
        END IF;
    END CASE;
  END IF;

  -- Perform escalation if needed
  IF v_should_escalate THEN
    -- Update incident
    UPDATE security_incidents
    SET 
      escalation_count = COALESCE(escalation_count, 0) + 1,
      escalated_at = NOW(),
      updated_at = NOW()
    WHERE id = p_incident_id;

    -- Add timeline entry
    INSERT INTO incident_timeline (
      incident_id,
      timestamp,
      event_type,
      action_ar,
      action_en,
      details
    )
    VALUES (
      p_incident_id,
      NOW(),
      'escalated',
      'تم تصعيد الحدث',
      'Incident escalated',
      jsonb_build_object(
        'reason', v_escalation_reason,
        'escalation_count', COALESCE(v_incident.escalation_count, 0) + 1
      )
    );

    v_result := jsonb_build_object(
      'escalated', TRUE,
      'reason', v_escalation_reason,
      'incident_id', p_incident_id,
      'incident_number', v_incident.incident_number
    );
  ELSE
    v_result := jsonb_build_object(
      'escalated', FALSE,
      'incident_id', p_incident_id
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Function: Auto Assign Incident
-- Automatically assigns an incident based on type and availability
CREATE OR REPLACE FUNCTION auto_assign_incident(p_incident_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incident RECORD;
  v_assigned_to UUID;
  v_result JSONB;
BEGIN
  -- Get incident details
  SELECT * INTO v_incident
  FROM security_incidents
  WHERE id = p_incident_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Incident not found: %', p_incident_id;
  END IF;

  -- Check if already assigned
  IF v_incident.assigned_to IS NOT NULL THEN
    RETURN jsonb_build_object(
      'assigned', FALSE,
      'reason', 'Incident already assigned',
      'incident_id', p_incident_id
    );
  END IF;

  -- Auto-assign logic based on incident type
  -- For now, assign to the first available security officer in the tenant
  -- In production, this should use a more sophisticated algorithm:
  -- - Load balancing based on current workload
  -- - Expertise matching based on incident type
  -- - Availability/shift schedules
  -- - Priority-based assignment
  
  SELECT ut.user_id INTO v_assigned_to
  FROM user_tenants ut
  INNER JOIN user_roles ur ON ut.user_id = ur.user_id
  WHERE ut.tenant_id = v_incident.tenant_id
    AND ur.role_id IN (
      SELECT id FROM roles WHERE code IN ('security_officer', 'security_manager')
    )
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_assigned_to IS NOT NULL THEN
    -- Update incident
    UPDATE security_incidents
    SET 
      assigned_to = v_assigned_to,
      updated_at = NOW()
    WHERE id = p_incident_id;

    -- Add timeline entry
    INSERT INTO incident_timeline (
      incident_id,
      timestamp,
      event_type,
      action_ar,
      action_en,
      details
    )
    VALUES (
      p_incident_id,
      NOW(),
      'assigned',
      'تم التعيين التلقائي',
      'Auto-assigned',
      jsonb_build_object('assigned_to', v_assigned_to)
    );

    v_result := jsonb_build_object(
      'assigned', TRUE,
      'assigned_to', v_assigned_to,
      'incident_id', p_incident_id,
      'incident_number', v_incident.incident_number
    );
  ELSE
    v_result := jsonb_build_object(
      'assigned', FALSE,
      'reason', 'No available security officers found',
      'incident_id', p_incident_id
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_incident_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION escalate_incident(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_incident(UUID) TO authenticated;