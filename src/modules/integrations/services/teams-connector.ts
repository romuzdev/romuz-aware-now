/**
 * Microsoft Teams Connector Service
 * Gate-M15: Teams Integration Helper Functions
 */

import { supabase } from '@/integrations/supabase/client';

export interface TeamsNotificationOptions {
  connectorId: string;
  title: string;
  text: string;
  sections?: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    facts?: Array<{ name: string; value: string }>;
  }>;
  actions?: Array<{
    type: string;
    title: string;
    url?: string;
  }>;
  themeColor?: string;
}

export interface TeamsSyncOptions {
  connectorId: string;
  syncType: 'channels' | 'users' | 'both';
}

/**
 * Send notification to Microsoft Teams channel
 */
export async function sendTeamsNotification(options: TeamsNotificationOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('teams-notify', {
      body: {
        connector_id: options.connectorId,
        title: options.title,
        text: options.text,
        sections: options.sections,
        actions: options.actions,
        theme_color: options.themeColor || '0078D4',
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
    throw error;
  }
}

/**
 * Sync Teams channels and users
 */
export async function syncTeamsData(options: TeamsSyncOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('teams-sync', {
      body: {
        connector_id: options.connectorId,
        sync_type: options.syncType,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Failed to sync Teams data:', error);
    throw error;
  }
}

/**
 * Test Teams connection
 */
export async function testTeamsConnection(connectorId: string) {
  try {
    const result = await sendTeamsNotification({
      connectorId,
      title: 'Test Connection',
      text: 'This is a test message from Romuz Cybersecurity Platform.',
      themeColor: '28A745',
    });

    return { success: true, message: 'Teams connection test successful' };
  } catch (error) {
    console.error('Teams connection test failed:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Create Teams message card helpers
 */
export const TeamsMessageBuilder = {
  /**
   * Create a simple notification card
   */
  simple(title: string, message: string, themeColor?: string): TeamsNotificationOptions {
    return {
      connectorId: '', // To be filled by caller
      title,
      text: message,
      themeColor: themeColor || '0078D4',
    };
  },

  /**
   * Create an alert card with facts
   */
  alert(
    title: string,
    message: string,
    facts: Array<{ name: string; value: string }>,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Omit<TeamsNotificationOptions, 'connectorId'> {
    const colors = {
      info: '0078D4',
      warning: 'FFC107',
      error: 'DC3545',
    };

    return {
      title,
      text: message,
      sections: [
        {
          activityTitle: title,
          facts,
        },
      ],
      themeColor: colors[severity],
    };
  },

  /**
   * Create an actionable card with buttons
   */
  actionable(
    title: string,
    message: string,
    actions: Array<{ title: string; url: string }>
  ): Omit<TeamsNotificationOptions, 'connectorId'> {
    return {
      title,
      text: message,
      actions: actions.map(action => ({
        type: 'OpenUri',
        title: action.title,
        url: action.url,
      })),
      themeColor: '0078D4',
    };
  },
};
