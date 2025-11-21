/**
 * M18: Incident Report Generator Component
 * Generates comprehensive incident reports
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import { 
  FileText, 
  Download, 
  Mail, 
  Printer, 
  Eye,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface IncidentData {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  detectedAt: string;
  reportedAt: string;
  reportedBy: string;
  assignedTo?: string;
  assignedTeam?: string;
  incidentType: string;
  affectedAssets?: string[];
  affectedUsers?: string[];
  rootCause?: string;
  impactAssessment?: any;
  containmentActions?: any;
  resolutionActions?: any;
  lessonsLearned?: string;
  estimatedCost?: number;
  closedAt?: string;
}

interface ReportSection {
  id: string;
  label: string;
  icon: any;
  description: string;
  required: boolean;
}

const REPORT_SECTIONS: ReportSection[] = [
  { id: 'executive_summary', label: 'الملخص التنفيذي', icon: FileText, description: 'نظرة عامة على الحادثة', required: true },
  { id: 'incident_details', label: 'تفاصيل الحادثة', icon: AlertTriangle, description: 'معلومات الحادثة الكاملة', required: true },
  { id: 'timeline', label: 'الجدول الزمني', icon: Clock, description: 'تسلسل الأحداث', required: true },
  { id: 'impact_assessment', label: 'تقييم الأثر', icon: Activity, description: 'الأضرار والتأثيرات', required: false },
  { id: 'response_actions', label: 'إجراءات الاستجابة', icon: Shield, description: 'الخطوات المتخذة', required: true },
  { id: 'root_cause', label: 'السبب الجذري', icon: AlertTriangle, description: 'تحليل السبب', required: false },
  { id: 'lessons_learned', label: 'الدروس المستفادة', icon: CheckCircle2, description: 'التوصيات والتحسينات', required: false },
  { id: 'team_response', label: 'أداء الفريق', icon: Users, description: 'تقييم الاستجابة', required: false },
];

interface IncidentReportGeneratorProps {
  incident: IncidentData;
  onGenerate: (sections: string[], format: string) => void;
}

export function IncidentReportGenerator({ incident, onGenerate }: IncidentReportGeneratorProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    REPORT_SECTIONS.filter(s => s.required).map(s => s.id)
  );
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSection = (sectionId: string, required: boolean) => {
    if (required) return; // Cannot toggle required sections
    
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(selectedSections, reportFormat);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'closed': return 'text-green-600 dark:text-green-400';
      case 'resolved': return 'text-blue-600 dark:text-blue-400';
      case 'investigating': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Incident Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>إنشاء تقرير حادثة</CardTitle>
              <CardDescription>
                {incident.incidentNumber} - {incident.title}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 ml-2" />
                معاينة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">الخطورة</p>
              <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                {incident.severity}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">الحالة</p>
              <Badge variant="outline" className={getStatusColor(incident.status)}>
                {incident.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">تاريخ الاكتشاف</p>
              <p className="text-sm font-medium">
                {format(new Date(incident.detectedAt), 'dd MMM yyyy', { locale: ar })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">المدة</p>
              <p className="text-sm font-medium">
                {incident.closedAt 
                  ? `${Math.round((new Date(incident.closedAt).getTime() - new Date(incident.detectedAt).getTime()) / (1000 * 60 * 60))} ساعة`
                  : 'جاري...'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Sections Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>أقسام التقرير</CardTitle>
            <CardDescription>
              اختر الأقسام التي تريد تضمينها في التقرير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {REPORT_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isSelected = selectedSections.includes(section.id);
                
                return (
                  <div
                    key={section.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={section.id}
                      checked={isSelected}
                      onCheckedChange={() => toggleSection(section.id, section.required)}
                      disabled={section.required}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={section.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{section.label}</span>
                        {section.required && (
                          <Badge variant="secondary" className="text-xs">مطلوب</Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>تضمين المرفقات</Label>
                  <p className="text-xs text-muted-foreground">
                    إضافة الأدلة والملفات المرفقة
                  </p>
                </div>
                <Checkbox
                  checked={includeAttachments}
                  onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Settings & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إعدادات التقرير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>صيغة التقرير</Label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF
                      </div>
                    </SelectItem>
                    <SelectItem value="docx">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Word (DOCX)
                      </div>
                    </SelectItem>
                    <SelectItem value="html">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        HTML
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>معلومات إضافية</Label>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>• الأقسام المختارة: {selectedSections.length}</p>
                  <p>• الصفحات المتوقعة: {selectedSections.length * 2 + 3}</p>
                  <p>• وقت الإنشاء: ~30 ثانية</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإجراءات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedSections.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 ml-2" />
                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 ml-2" />
                إرسال بالبريد
              </Button>
              
              <Button variant="outline" className="w-full">
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
