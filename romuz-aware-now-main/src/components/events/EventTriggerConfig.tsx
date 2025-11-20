/**
 * Week 9-10: Event Trigger Configuration Component
 * 
 * Allows configuration of event triggers for automation rules
 */

import { useState } from 'react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Separator } from '@/core/components/ui/separator';
import { Plus, X, Zap, Search } from 'lucide-react';
import type { EventCategory } from '@/lib/events';

interface EventTriggerConfigProps {
  selectedEventTypes: string[];
  onEventTypesChange: (types: string[]) => void;
}

/**
 * Event Type Definitions by Category
 * Comprehensive list of all event types in the system
 */
const EVENT_TYPES_BY_CATEGORY: Record<EventCategory, string[]> = {
  auth: [
    'user_login',
    'user_logout',
    'user_registered',
    'user_deleted',
    'password_changed',
    'mfa_enabled',
    'session_expired',
  ],
  policy: [
    'policy_created',
    'policy_updated',
    'policy_deleted',
    'policy_published',
    'policy_archived',
    'policy_review_requested',
    'policy_approved',
  ],
  action: [
    'action_created',
    'action_updated',
    'action_completed',
    'action_overdue',
    'action_assigned',
    'action_escalated',
  ],
  kpi: [
    'kpi_threshold_breached',
    'kpi_target_achieved',
    'kpi_updated',
    'kpi_report_generated',
  ],
  campaign: [
    'campaign_created',
    'campaign_started',
    'campaign_completed',
    'campaign_participant_added',
    'campaign_participant_completed',
  ],
  analytics: [
    'report_generated',
    'export_completed',
    'analytics_refreshed',
  ],
  training: [
    'training_assigned',
    'training_completed',
    'training_failed',
    'certificate_issued',
  ],
  awareness: [
    'awareness_score_computed',
    'awareness_threshold_breached',
    'impact_validation_completed',
  ],
  phishing: [
    'simulation_launched',
    'simulation_completed',
    'user_clicked_phishing',
    'user_reported_phishing',
  ],
  document: [
    'document_uploaded',
    'document_approved',
    'document_expired',
    'document_downloaded',
  ],
  committee: [
    'meeting_scheduled',
    'meeting_started',
    'meeting_completed',
    'decision_made',
    'workflow_created',
  ],
  content: [
    'content_published',
    'content_updated',
    'content_deleted',
  ],
  culture: [
    'culture_score_updated',
    'culture_survey_completed',
  ],
  objective: [
    'objective_created',
    'objective_updated',
    'objective_achieved',
    'milestone_reached',
  ],
  alert: [
    'alert_triggered',
    'alert_acknowledged',
    'alert_resolved',
  ],
  system: [
    'system_health_check',
    'backup_completed',
    'maintenance_started',
    'error_occurred',
  ],
  admin: [
    'user_account_created',
    'settings_updated',
    'role_assignment_changed',
  ],
  grc: [
    'policy_approved',
    'risk_identified',
    'control_implemented',
  ],
  platform: [
    'tenant_created',
    'subscription_updated',
    'support_ticket_created',
  ],
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  auth: 'المصادقة والتفويض',
  policy: 'السياسات',
  action: 'الإجراءات',
  kpi: 'مؤشرات الأداء',
  campaign: 'الحملات',
  analytics: 'التحليلات',
  training: 'التدريب',
  awareness: 'الوعي الأمني',
  phishing: 'محاكاة التصيد',
  admin: 'الإدارة',
  grc: 'الحوكمة والمخاطر',
  platform: 'المنصة',
  document: 'المستندات',
  committee: 'اللجان',
  content: 'المحتوى',
  culture: 'ثقافة الأمن',
  objective: 'الأهداف',
  alert: 'التنبيهات',
  system: 'النظام',
};

export function EventTriggerConfig({ 
  selectedEventTypes, 
  onEventTypesChange 
}: EventTriggerConfigProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<EventCategory>>(
    new Set(['policy', 'action', 'campaign'])
  );

  const toggleCategory = (category: EventCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleEventType = (eventType: string) => {
    if (selectedEventTypes.includes(eventType)) {
      onEventTypesChange(selectedEventTypes.filter(t => t !== eventType));
    } else {
      onEventTypesChange([...selectedEventTypes, eventType]);
    }
  };

  const toggleAllInCategory = (category: EventCategory) => {
    const categoryEvents = EVENT_TYPES_BY_CATEGORY[category];
    const allSelected = categoryEvents.every(e => selectedEventTypes.includes(e));
    
    if (allSelected) {
      // Deselect all from this category
      onEventTypesChange(selectedEventTypes.filter(t => !categoryEvents.includes(t)));
    } else {
      // Select all from this category
      const newTypes = new Set([...selectedEventTypes, ...categoryEvents]);
      onEventTypesChange(Array.from(newTypes));
    }
  };

  const filteredCategories = Object.entries(EVENT_TYPES_BY_CATEGORY).filter(
    ([_, events]) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return events.some(e => e.toLowerCase().includes(query));
    }
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">مشغلات الأحداث</h3>
          </div>
          <Badge variant="outline">
            {selectedEventTypes.length} محددة
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          اختر الأحداث التي ستشغل هذه القاعدة تلقائياً
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن نوع الحدث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Selected Event Types */}
        {selectedEventTypes.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {selectedEventTypes.map(eventType => (
                <Badge key={eventType} variant="secondary" className="gap-1">
                  {eventType}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleEventType(eventType)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Separator />
          </>
        )}

        {/* Event Types by Category */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {filteredCategories.map(([category, events]) => {
              const typedCategory = category as EventCategory;
              const isExpanded = expandedCategories.has(typedCategory);
              const selectedCount = events.filter(e => selectedEventTypes.includes(e)).length;
              const allSelected = events.every(e => selectedEventTypes.includes(e));

              return (
                <Card key={category} className="p-4">
                  <div className="space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleCategory(typedCategory)}
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                      >
                        <span>{CATEGORY_LABELS[typedCategory]}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedCount}/{events.length}
                        </Badge>
                      </button>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleAllInCategory(typedCategory)}
                        />
                        <Label className="text-xs text-muted-foreground cursor-pointer">
                          تحديد الكل
                        </Label>
                      </div>
                    </div>

                    {/* Event Types List */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t">
                        {events
                          .filter(e => 
                            !searchQuery || 
                            e.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map(eventType => (
                            <div
                              key={eventType}
                              className="flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors"
                            >
                              <Checkbox
                                id={eventType}
                                checked={selectedEventTypes.includes(eventType)}
                                onCheckedChange={() => toggleEventType(eventType)}
                              />
                              <Label
                                htmlFor={eventType}
                                className="flex-1 text-sm cursor-pointer"
                              >
                                {eventType}
                              </Label>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Help Text */}
        <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
          <p>💡 يمكنك اختيار أحداث متعددة. ستعمل القاعدة عند حدوث أي من الأحداث المحددة.</p>
        </div>
      </div>
    </Card>
  );
}
