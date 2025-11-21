/**
 * M18: Incident Response System - Escalation Manager
 * Manage and configure incident escalation rules and history
 */

import React, { useState } from 'react';
import { 
  ArrowUpCircle, 
  Clock, 
  Users, 
  AlertTriangle,
  Settings,
  History,
  Bell,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { Switch } from '@/core/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Separator } from '@/core/components/ui/separator';
import { useToast } from '@/core/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface EscalationRule {
  severity: string;
  time_threshold_minutes: number;
  notify_roles: string[];
  auto_reassign: boolean;
}

interface EscalationEvent {
  id: string;
  incident_id: string;
  incident_number: string;
  escalated_at: string;
  reason: string;
  escalation_level: number;
  notified_users: string[];
}

interface EscalationManagerProps {
  incidentId?: string;
  currentEscalationLevel?: number;
  escalationHistory?: EscalationEvent[];
  onEscalate?: () => void;
  className?: string;
}

/**
 * Format time threshold in Arabic
 */
function formatTimeThreshold(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} ساعة`;
}

/**
 * Get severity color
 */
function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

/**
 * Escalation Manager Component
 */
export function EscalationManager({
  incidentId,
  currentEscalationLevel = 0,
  escalationHistory = [],
  onEscalate,
  className,
}: EscalationManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('rules');

  // Default escalation rules
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([
    {
      severity: 'critical',
      time_threshold_minutes: 15,
      notify_roles: ['security_manager', 'ciso'],
      auto_reassign: true,
    },
    {
      severity: 'high',
      time_threshold_minutes: 30,
      notify_roles: ['security_manager'],
      auto_reassign: true,
    },
    {
      severity: 'medium',
      time_threshold_minutes: 120,
      notify_roles: ['security_officer'],
      auto_reassign: false,
    },
    {
      severity: 'low',
      time_threshold_minutes: 1440,
      notify_roles: ['security_officer'],
      auto_reassign: false,
    },
  ]);

  const [autoEscalationEnabled, setAutoEscalationEnabled] = useState(true);

  /**
   * Manual escalation
   */
  const handleManualEscalation = () => {
    if (onEscalate) {
      onEscalate();
    }
    toast({
      title: '✅ تم التصعيد',
      description: 'تم تصعيد الحادث يدوياً بنجاح',
    });
  };

  /**
   * Save escalation rules
   */
  const saveEscalationRules = () => {
    // In production, this would save to the database
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ قواعد التصعيد بنجاح',
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 ml-2" />
            القواعد
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 ml-2" />
            السجل
          </TabsTrigger>
          <TabsTrigger value="chain">
            <Users className="h-4 w-4 ml-2" />
            سلسلة التصعيد
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إعدادات التصعيد التلقائي</CardTitle>
                  <CardDescription>
                    تكوين قواعد التصعيد التلقائي حسب مستوى الخطورة
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-escalation">تفعيل التلقائي</Label>
                  <Switch
                    id="auto-escalation"
                    checked={autoEscalationEnabled}
                    onCheckedChange={setAutoEscalationEnabled}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {escalationRules.map((rule, index) => (
                <div key={rule.severity}>
                  {index > 0 && <Separator />}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-sm', getSeverityColor(rule.severity))}>
                        {rule.severity === 'critical' && 'حرج'}
                        {rule.severity === 'high' && 'عالي'}
                        {rule.severity === 'medium' && 'متوسط'}
                        {rule.severity === 'low' && 'منخفض'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        مستوى الخطورة
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>الحد الزمني للتصعيد</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={rule.time_threshold_minutes}
                            onChange={(e) => {
                              const newRules = [...escalationRules];
                              newRules[index].time_threshold_minutes = parseInt(e.target.value);
                              setEscalationRules(newRules);
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">دقيقة</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ({formatTimeThreshold(rule.time_threshold_minutes)})
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>الأدوار المُخطَرة</Label>
                        <Select defaultValue={rule.notify_roles[0]}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="security_officer">ضابط أمن</SelectItem>
                            <SelectItem value="security_manager">مدير الأمن</SelectItem>
                            <SelectItem value="ciso">مسؤول أمن المعلومات</SelectItem>
                            <SelectItem value="ceo">المدير التنفيذي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`auto-reassign-${rule.severity}`}
                        checked={rule.auto_reassign}
                        onCheckedChange={(checked) => {
                          const newRules = [...escalationRules];
                          newRules[index].auto_reassign = checked;
                          setEscalationRules(newRules);
                        }}
                      />
                      <label
                        htmlFor={`auto-reassign-${rule.severity}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        إعادة تعيين تلقائي عند التصعيد
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-end">
                <Button onClick={saveEscalationRules}>
                  <Settings className="h-4 w-4 ml-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التصعيدات</CardTitle>
              <CardDescription>
                جميع عمليات التصعيد التي تمت على هذا الحادث
              </CardDescription>
            </CardHeader>
            <CardContent>
              {escalationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    لم يتم تصعيد هذا الحادث بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {escalationHistory.map((event, index) => (
                    <Card key={event.id} className="border-r-4 border-r-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                            <ArrowUpCircle className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">
                                  التصعيد المستوى {event.escalation_level}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {event.incident_number}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(event.escalated_at), 'dd MMM yyyy - HH:mm', {
                                  locale: ar,
                                })}
                              </p>
                            </div>
                            <p className="text-sm">{event.reason}</p>
                            {event.notified_users.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Bell className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  تم إخطار {event.notified_users.length} مستخدم
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation Chain Tab */}
        <TabsContent value="chain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سلسلة التصعيد</CardTitle>
              <CardDescription>
                المسارات الهرمية للتصعيد حسب مستوى الخطورة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Critical Path */}
                <div className="space-y-3">
                  <Badge className="bg-red-100 text-red-800">حرج (Critical)</Badge>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-sm">ضابط الأمن</p>
                          <p className="text-xs text-muted-foreground">استجابة فورية</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground mr-auto" />
                        <span className="text-xs text-muted-foreground">0-15 دقيقة</span>
                      </div>

                      <div className="flex justify-center">
                        <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
                      </div>

                      <div className="flex items-center gap-3 rounded-lg border p-3 bg-orange-50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-semibold">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-sm">مدير الأمن</p>
                          <p className="text-xs text-muted-foreground">تصعيد أولي</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground mr-auto" />
                        <span className="text-xs text-muted-foreground">بعد 15 دقيقة</span>
                      </div>

                      <div className="flex justify-center">
                        <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
                      </div>

                      <div className="flex items-center gap-3 rounded-lg border p-3 bg-red-50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white text-sm font-semibold">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-sm">CISO / المدير التنفيذي</p>
                          <p className="text-xs text-muted-foreground">تصعيد حرج</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground mr-auto" />
                        <span className="text-xs text-muted-foreground">بعد ساعة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Info box */}
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">
                        ملاحظة هامة
                      </p>
                      <p className="text-xs text-blue-800">
                        يتم التصعيد التلقائي بناءً على مستوى الخطورة والوقت المنقضي منذ الإبلاغ
                        عن الحادث. يمكن للمستخدمين المصرح لهم إجراء تصعيد يدوي في أي وقت.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Escalation */}
          {incidentId && (
            <Card>
              <CardHeader>
                <CardTitle>تصعيد يدوي</CardTitle>
                <CardDescription>
                  تصعيد الحادث يدوياً إلى المستوى التالي
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">المستوى الحالي</p>
                    <Badge variant="outline">المستوى {currentEscalationLevel}</Badge>
                  </div>
                  <Button onClick={handleManualEscalation} variant="destructive">
                    <ArrowUpCircle className="h-4 w-4 ml-2" />
                    تصعيد الآن
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
