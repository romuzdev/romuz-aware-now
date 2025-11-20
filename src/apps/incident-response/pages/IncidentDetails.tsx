/**
 * M18: Incident Response - Incident Details Page
 */

import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';
import { useIncident, useIncidentTimeline, useAcknowledgeIncident, useAssignIncident, useAddIncidentNote, useCloseIncident } from '../hooks/useIncidents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  ArrowLeft,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { Label } from '@/core/components/ui/label';
import { Separator } from '@/core/components/ui/separator';
import { ScrollArea } from '@/core/components/ui/scroll-area';

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [noteText, setNoteText] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const { data: incident, isLoading } = useIncident(id);
  const { data: timeline, isLoading: timelineLoading } = useIncidentTimeline(id);

  const acknowledgeMutation = useAcknowledgeIncident();
  const addNoteMutation = useAddIncidentNote();
  const closeIncidentMutation = useCloseIncident();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'investigating':
        return 'default';
      case 'contained':
        return 'secondary';
      case 'resolved':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleAcknowledge = () => {
    if (id) {
      acknowledgeMutation.mutate(id);
    }
  };

  const handleAddNote = () => {
    if (id && noteText.trim()) {
      addNoteMutation.mutate(
        {
          incidentId: id,
          noteAr: noteText,
          noteEn: noteText,
        },
        {
          onSuccess: () => {
            setNoteText('');
            setShowNoteDialog(false);
          },
        }
      );
    }
  };

  const handleCloseIncident = () => {
    if (id && resolutionNote.trim()) {
      closeIncidentMutation.mutate(
        {
          incidentId: id,
          resolution: {
            root_cause_ar: resolutionNote,
            root_cause_en: resolutionNote,
            lessons_learned_ar: resolutionNote,
            lessons_learned_en: resolutionNote,
          },
        },
        {
          onSuccess: () => {
            setResolutionNote('');
            setShowCloseDialog(false);
            navigate('/incident-response/active');
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {isRTL ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  if (!incident) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{isRTL ? 'الحدث غير موجود' : 'Incident not found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/incident-response/active')}
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRTL ? 'العودة' : 'Back'}
        </Button>
        <PageHeader
          title={incident.incident_number || ''}
          description={isRTL ? incident.title_ar : incident.title_en}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'تفاصيل الحدث' : 'Incident Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">
                  {isRTL ? 'الوصف' : 'Description'}
                </Label>
                <p className="mt-1">
                  {isRTL ? incident.description_ar : incident.description_en}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {isRTL ? 'النوع' : 'Type'}
                  </Label>
                  <p className="mt-1 font-medium">
                    {isRTL
                      ? {
                          ransomware: 'برامج فدية',
                          data_breach: 'اختراق بيانات',
                          phishing: 'تصيد',
                          malware: 'برامج ضارة',
                          unauthorized_access: 'دخول غير مصرح',
                          ddos_attack: 'هجوم DDoS',
                          policy_violation: 'انتهاك سياسة',
                          social_engineering: 'هندسة اجتماعية',
                          insider_threat: 'تهديد داخلي',
                        }[incident.incident_type] || incident.incident_type
                      : incident.incident_type}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    {isRTL ? 'تاريخ الاكتشاف' : 'Detected At'}
                  </Label>
                  <p className="mt-1 font-medium">
                    {format(new Date(incident.detected_at), 'PPp', {
                      locale: isRTL ? ar : undefined,
                    })}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    {isRTL ? 'مستوى الخطورة' : 'Severity'}
                  </Label>
                  <div className="mt-1">
                    <Badge variant={getSeverityColor(incident.severity)}>
                      {isRTL
                        ? {
                            critical: 'حرجة',
                            high: 'عالية',
                            medium: 'متوسطة',
                            low: 'منخفضة',
                          }[incident.severity]
                        : incident.severity}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    {isRTL ? 'الحالة' : 'Status'}
                  </Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(incident.status)}>
                      {isRTL
                        ? {
                            open: 'مفتوح',
                            investigating: 'قيد التحقيق',
                            contained: 'محتوى',
                            resolved: 'محلول',
                            closed: 'مغلق',
                          }[incident.status]
                        : incident.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {isRTL ? 'الخط الزمني' : 'Timeline'}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? 'جميع الأحداث والإجراءات المتعلقة بهذا الحدث'
                  : 'All events and actions related to this incident'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <p className="text-muted-foreground text-center py-4">
                  {isRTL ? 'جاري التحميل...' : 'Loading...'}
                </p>
              ) : timeline && timeline.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {timeline.map((event: any, index: number) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {isRTL ? event.action_ar : event.action_en}
                              </p>
                              {event.details && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {typeof event.details === 'string'
                                    ? event.details
                                    : JSON.stringify(event.details)}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(event.timestamp), {
                                addSuffix: true,
                                locale: isRTL ? ar : undefined,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {isRTL ? 'لا توجد أحداث بعد' : 'No events yet'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'الإجراءات' : 'Actions'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {incident.status !== 'closed' && (
                <>
                  {!incident.acknowledged_at && (
                    <Button
                      className="w-full"
                      onClick={handleAcknowledge}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                      {isRTL ? 'تأكيد الاستلام' : 'Acknowledge'}
                    </Button>
                  )}

                  <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="h-4 w-4 ml-2" />
                        {isRTL ? 'إضافة ملاحظة' : 'Add Note'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {isRTL ? 'إضافة ملاحظة جديدة' : 'Add New Note'}
                        </DialogTitle>
                        <DialogDescription>
                          {isRTL
                            ? 'أضف معلومات أو تحديثات حول هذا الحدث'
                            : 'Add information or updates about this incident'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>{isRTL ? 'الملاحظة' : 'Note'}</Label>
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder={
                              isRTL ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'
                            }
                            rows={6}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowNoteDialog(false)}
                        >
                          {isRTL ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                          onClick={handleAddNote}
                          disabled={!noteText.trim() || addNoteMutation.isPending}
                        >
                          {isRTL ? 'إضافة' : 'Add'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {(incident.status === 'resolved' || incident.status === 'contained') && (
                    <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <XCircle className="h-4 w-4 ml-2" />
                          {isRTL ? 'إغلاق الحدث' : 'Close Incident'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {isRTL ? 'إغلاق الحدث نهائياً' : 'Close Incident'}
                          </DialogTitle>
                          <DialogDescription>
                            {isRTL
                              ? 'أضف ملخص الحل والدروس المستفادة قبل الإغلاق النهائي'
                              : 'Add resolution summary and lessons learned before closing'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>{isRTL ? 'ملخص الحل' : 'Resolution Summary'}</Label>
                            <Textarea
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              placeholder={
                                isRTL
                                  ? 'اشرح كيف تم حل المشكلة...'
                                  : 'Explain how the issue was resolved...'
                              }
                              rows={6}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowCloseDialog(false)}
                          >
                            {isRTL ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCloseIncident}
                            disabled={
                              !resolutionNote.trim() || closeIncidentMutation.isPending
                            }
                          >
                            {isRTL ? 'إغلاق' : 'Close'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}

              {incident.status === 'closed' && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>{isRTL ? 'تم إغلاق هذا الحدث' : 'This incident is closed'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'معلومات إضافية' : 'Additional Info'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.acknowledged_at && (
                <div>
                  <Label className="text-muted-foreground text-sm">
                    {isRTL ? 'تم التأكيد' : 'Acknowledged'}
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDistanceToNow(new Date(incident.acknowledged_at), {
                      addSuffix: true,
                      locale: isRTL ? ar : undefined,
                    })}
                  </p>
                </div>
              )}

              {incident.resolved_at && (
                <div>
                  <Label className="text-muted-foreground text-sm">
                    {isRTL ? 'تم الحل' : 'Resolved'}
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDistanceToNow(new Date(incident.resolved_at), {
                      addSuffix: true,
                      locale: isRTL ? ar : undefined,
                    })}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground text-sm">
                  {isRTL ? 'تم الإنشاء' : 'Created'}
                </Label>
                <p className="mt-1 text-sm">
                  {formatDistanceToNow(new Date(incident.created_at), {
                    addSuffix: true,
                    locale: isRTL ? ar : undefined,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
