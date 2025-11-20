/**
 * Enhanced Slack Connector Service
 * Gate-M15: Advanced Slack Integration with Interactive Features
 */

import { supabase } from '@/integrations/supabase/client';

export interface SlackMessageOptions {
  connectorId: string;
  message: string;
  channel?: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  thread_ts?: string;
}

export interface SlackAttachment {
  fallback: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: any[];
  accessory?: any;
}

export interface SlackInteractiveMessage extends SlackMessageOptions {
  buttons?: Array<{
    text: string;
    value: string;
    style?: 'default' | 'primary' | 'danger';
    url?: string;
  }>;
}

/**
 * Send enhanced Slack message with blocks and attachments
 */
export async function sendSlackMessage(options: SlackMessageOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('slack-notify', {
      body: {
        connector_id: options.connectorId,
        message: options.message,
        channel: options.channel,
        attachments: options.attachments,
        blocks: options.blocks,
        thread_ts: options.thread_ts,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send Slack message:', error);
    throw error;
  }
}

/**
 * Send interactive Slack message with action buttons
 */
export async function sendInteractiveSlackMessage(options: SlackInteractiveMessage) {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: options.message,
      },
    },
  ];

  // Add buttons if provided
  if (options.buttons && options.buttons.length > 0) {
    blocks.push({
      type: 'actions',
      elements: options.buttons.map(button => ({
        type: button.url ? 'button' : 'button',
        text: {
          type: 'plain_text',
          text: button.text,
          emoji: true,
        },
        value: button.value,
        style: button.style || 'default',
        url: button.url,
      })),
    });
  }

  return sendSlackMessage({
    ...options,
    blocks,
  });
}

/**
 * Slack Message Templates
 */
export const SlackTemplates = {
  /**
   * Campaign notification template
   */
  campaignLaunched(campaignName: string, startDate: string, url: string) {
    return {
      message: `🚀 *حملة توعية جديدة*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚀 حملة توعية جديدة',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${campaignName}*\nتاريخ البدء: ${startDate}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'عرض التفاصيل',
                emoji: true,
              },
              style: 'primary',
              url: url,
            },
          ],
        },
      ],
    };
  },

  /**
   * Alert notification template
   */
  alert(title: string, message: string, severity: 'info' | 'warning' | 'danger', url?: string) {
    const colors = {
      info: '#0078D4',
      warning: '#FFC107',
      danger: '#DC3545',
    };

    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      danger: '🚨',
    };

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emojis[severity]} ${title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    if (url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'عرض التفاصيل',
              emoji: true,
            },
            url: url,
          },
        ],
      });
    }

    return {
      message: `${emojis[severity]} ${title}`,
      blocks,
      attachments: [
        {
          color: colors[severity],
          fallback: message,
        },
      ],
    };
  },

  /**
   * Report ready notification
   */
  reportReady(reportName: string, downloadUrl: string) {
    return {
      message: `📊 *تقرير جاهز للتحميل*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📊 *تقرير جاهز*\n${reportName}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'تحميل التقرير',
                emoji: true,
              },
              style: 'primary',
              url: downloadUrl,
            },
          ],
        },
      ],
    };
  },

  /**
   * Task reminder template
   */
  taskReminder(taskName: string, dueDate: string, assignee: string, url: string) {
    return {
      message: `⏰ *تذكير بمهمة*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⏰ *تذكير بمهمة*\n*المهمة:* ${taskName}\n*المسؤول:* ${assignee}\n*تاريخ الاستحقاق:* ${dueDate}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'عرض المهمة',
                emoji: true,
              },
              style: 'primary',
              url: url,
            },
          ],
        },
      ],
    };
  },
};

/**
 * Test Slack connection
 */
export async function testSlackConnection(connectorId: string) {
  try {
    const result = await sendSlackMessage({
      connectorId,
      message: '✅ اختبار الاتصال ناجح!\nهذه رسالة تجريبية من منصة رموز للأمن السيبراني.',
    });

    return { success: true, message: 'Slack connection test successful' };
  } catch (error) {
    console.error('Slack connection test failed:', error);
    return { success: false, message: error.message };
  }
}
