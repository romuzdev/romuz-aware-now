/**
 * Phishing Simulation Module - Event Integration Hook
 * 
 * Integration between Phishing Simulation and Event System
 * Handles: Campaigns, Templates, User Interactions, Reports, Analytics
 */

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events/useEventBus';
import type { PublishEventParams } from '@/lib/events/event.types';

export function usePhishingAppEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Phishing Campaign Launched Event
   */
  const publishCampaignLaunched = useCallback(async (
    campaignId: string,
    campaignData: {
      name: string;
      template_id: string;
      target_count: number;
      launch_date: string;
      created_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'phishing_campaign_launched',
      event_category: 'phishing',
      source_module: 'phishing_app',
      entity_type: 'phishing_campaign',
      entity_id: campaignId,
      priority: 'high',
      payload: {
        campaign_id: campaignId,
        name: campaignData.name,
        template_id: campaignData.template_id,
        target_count: campaignData.target_count,
        launch_date: campaignData.launch_date,
        created_by: campaignData.created_by,
        launched_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Clicked Phishing Link Event
   */
  const publishUserClickedLink = useCallback(async (
    campaignId: string,
    interactionData: {
      user_id: string;
      email: string;
      click_time: string;
      ip_address: string;
      device_type: string;
      user_agent: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_clicked_phishing_link',
      event_category: 'phishing',
      source_module: 'phishing_app',
      entity_type: 'phishing_interaction',
      entity_id: `${campaignId}_${interactionData.user_id}`,
      priority: 'critical',
      payload: {
        campaign_id: campaignId,
        user_id: interactionData.user_id,
        email: interactionData.email,
        click_time: interactionData.click_time,
        ip_address: interactionData.ip_address,
        device_type: interactionData.device_type,
        user_agent: interactionData.user_agent,
        recorded_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Reported Phishing Event
   */
  const publishUserReportedPhishing = useCallback(async (
    campaignId: string,
    reportData: {
      user_id: string;
      email: string;
      report_time: string;
      report_method: string;
      time_to_report_seconds: number;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_reported_phishing',
      event_category: 'phishing',
      source_module: 'phishing_app',
      entity_type: 'phishing_report',
      entity_id: `${campaignId}_${reportData.user_id}`,
      priority: 'low',
      payload: {
        campaign_id: campaignId,
        user_id: reportData.user_id,
        email: reportData.email,
        report_time: reportData.report_time,
        report_method: reportData.report_method,
        time_to_report_seconds: reportData.time_to_report_seconds,
        reported_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Submitted Credentials Event
   */
  const publishUserSubmittedCredentials = useCallback(async (
    campaignId: string,
    credentialData: {
      user_id: string;
      email: string;
      submission_time: string;
      fields_submitted: string[];
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_submitted_credentials',
      event_category: 'phishing',
      source_module: 'phishing_app',
      entity_type: 'phishing_interaction',
      entity_id: `${campaignId}_${credentialData.user_id}`,
      priority: 'critical',
      payload: {
        campaign_id: campaignId,
        user_id: credentialData.user_id,
        email: credentialData.email,
        submission_time: credentialData.submission_time,
        fields_submitted: credentialData.fields_submitted,
        recorded_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Phishing Campaign Completed Event
   */
  const publishCampaignCompleted = useCallback(async (
    campaignId: string,
    completionData: {
      total_targets: number;
      emails_sent: number;
      clicks: number;
      reports: number;
      credentials_submitted: number;
      click_rate: number;
      report_rate: number;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'phishing_campaign_completed',
      event_category: 'phishing',
      source_module: 'phishing_app',
      entity_type: 'phishing_campaign',
      entity_id: campaignId,
      priority: 'high',
      payload: {
        campaign_id: campaignId,
        total_targets: completionData.total_targets,
        emails_sent: completionData.emails_sent,
        clicks: completionData.clicks,
        reports: completionData.reports,
        credentials_submitted: completionData.credentials_submitted,
        click_rate: completionData.click_rate,
        report_rate: completionData.report_rate,
        completed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishCampaignLaunched,
    publishUserClickedLink,
    publishUserReportedPhishing,
    publishUserSubmittedCredentials,
    publishCampaignCompleted,
  };
}
