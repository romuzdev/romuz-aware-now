/**
 * Findings Categorization Component
 * M12: Advanced findings management with categorization and severity tracking
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Badge } from '@/core/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Search,
  Shield,
  TrendingUp,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type { 
  FindingSeverity, 
  FindingStatus, 
  CreateFindingInput
} from '../../types/audit-workflow-stages.types';
import { FINDING_CATEGORIES } from '../../types/audit-workflow-stages.types';

interface Finding extends CreateFindingInput {
  id: string;
  status: FindingStatus;
  created_at?: string;
  updated_at?: string;
}

interface FindingsCategorizationProps {
  auditId: string;
  findings?: Finding[];
  onCreateFinding?: (finding: CreateFindingInput) => Promise<void>;
  onUpdateFinding?: (findingId: string, status: FindingStatus) => Promise<void>;
}

export function FindingsCategorization({
  auditId,
  findings = [],
  onCreateFinding,
  onUpdateFinding
}: FindingsCategorizationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<FindingSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FindingStatus | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);

  // New finding form state
  const [newFinding, setNewFinding] = useState<Partial<CreateFindingInput>>({
    audit_id: auditId,
    severity: 'medium',
    finding_ar: '',
    recommendation_ar: ''
  });

  // Severity configuration
  const severityConfig = {
    critical: {
      label: 'حرجة',
      color: 'text-red-600 bg-red-50',
      icon: AlertCircle,
      badgeVariant: 'destructive' as const
    },
    high: {
      label: 'عالية',
      color: 'text-orange-600 bg-orange-50',
      icon: AlertTriangle,
      badgeVariant: 'destructive' as const
    },
    medium: {
      label: 'متوسطة',
      color: 'text-yellow-600 bg-yellow-50',
      icon: AlertCircle,
      badgeVariant: 'default' as const
    },
    low: {
      label: 'منخفضة',
      color: 'text-blue-600 bg-blue-50',
      icon: Shield,
      badgeVariant: 'secondary' as const
    }
  };

  // Status configuration
  const statusConfig = {
    open: {
      label: 'مفتوح',
      icon: FileText,
      color: 'text-blue-600'
    },
    in_progress: {
      label: 'قيد المعالجة',
      icon: Clock,
      color: 'text-orange-600'
    },
    resolved: {
      label: 'تم الحل',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    accepted_risk: {
      label: 'مخاطرة مقبولة',
      icon: Shield,
      color: 'text-gray-600'
    }
  };

  // Filter findings
  const filteredFindings = findings.filter(finding => {
    const matchesSearch = !searchQuery || 
      finding.finding_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.category_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || finding.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || finding.status === filterStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Group findings by severity
  const findingsBySeverity = filteredFindings.reduce((acc, finding) => {
    if (!acc[finding.severity]) {
      acc[finding.severity] = [];
    }
    acc[finding.severity].push(finding);
    return acc;
  }, {} as Record<FindingSeverity, Finding[]>);

  // Calculate statistics
  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    open: findings.filter(f => f.status === 'open').length,
    inProgress: findings.filter(f => f.status === 'in_progress').length,
    resolved: findings.filter(f => f.status === 'resolved').length
  };

  // Handle create finding
  const handleCreateFinding = async () => {
    if (!newFinding.category_code || !newFinding.finding_ar) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateFinding?.(newFinding as CreateFindingInput);
      setIsDialogOpen(false);
      setNewFinding({
        audit_id: auditId,
        severity: 'medium',
        finding_ar: '',
        recommendation_ar: ''
      });
      toast.success('تم إضافة النتيجة بنجاح');
    } catch (error) {
      toast.error('فشل إضافة النتيجة');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (findingId: string, status: FindingStatus) => {
    try {
      await onUpdateFinding?.(findingId, status);
      toast.success('تم تحديث الحالة بنجاح');
    } catch (error) {
      toast.error('فشل تحديث الحالة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي النتائج</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حرجة + عالية</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical + stats.high}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مفتوحة</p>
                <p className="text-2xl font-bold text-orange-600">{stats.open}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم الحل</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>نتائج التدقيق</CardTitle>
              <CardDescription>
                تصنيف وإدارة نتائج التدقيق حسب الأهمية والفئة
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              إضافة نتيجة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في النتائج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterSeverity} onValueChange={(value) => setFilterSeverity(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الأهمية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأهميات</SelectItem>
                <SelectItem value="critical">حرجة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="open">مفتوح</SelectItem>
                <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="accepted_risk">مخاطرة مقبولة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Findings by Severity */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">الكل ({filteredFindings.length})</TabsTrigger>
              <TabsTrigger value="critical">حرجة ({findingsBySeverity.critical?.length || 0})</TabsTrigger>
              <TabsTrigger value="high">عالية ({findingsBySeverity.high?.length || 0})</TabsTrigger>
              <TabsTrigger value="medium">متوسطة ({findingsBySeverity.medium?.length || 0})</TabsTrigger>
              <TabsTrigger value="low">منخفضة ({findingsBySeverity.low?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد نتائج</p>
                </div>
              ) : (
                filteredFindings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    severityConfig={severityConfig}
                    statusConfig={statusConfig}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </TabsContent>

            {(['critical', 'high', 'medium', 'low'] as FindingSeverity[]).map((severity) => (
              <TabsContent key={severity} value={severity} className="space-y-4 mt-4">
                {(findingsBySeverity[severity] || []).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>لا توجد نتائج في هذه الفئة</p>
                  </div>
                ) : (
                  (findingsBySeverity[severity] || []).map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      severityConfig={severityConfig}
                      statusConfig={statusConfig}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Finding Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة نتيجة تدقيق جديدة</DialogTitle>
            <DialogDescription>
              قم بتوثيق نتيجة التدقيق مع تحديد الأهمية والتوصيات
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الفئة *</Label>
                <Select
                  value={newFinding.category_code}
                  onValueChange={(value) => {
                    const category = (FINDING_CATEGORIES as any).find((c: any) => c.code === value);
                    setNewFinding({
                      ...newFinding,
                      category_code: value,
                      category_name: category?.name,
                      category_name_ar: category?.name_ar
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(FINDING_CATEGORIES as any).map((cat: any) => (
                      <SelectItem key={cat.code} value={cat.code}>
                        {cat.code} - {cat.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الأهمية *</Label>
                <Select
                  value={newFinding.severity}
                  onValueChange={(value) => setNewFinding({ ...newFinding, severity: value as FindingSeverity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">حرجة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>النتيجة (بالعربية) *</Label>
              <Textarea
                value={newFinding.finding_ar}
                onChange={(e) => setNewFinding({ ...newFinding, finding_ar: e.target.value })}
                placeholder="وصف تفصيلي للنتيجة..."
                rows={4}
              />
            </div>

            <div>
              <Label>التوصية (بالعربية) *</Label>
              <Textarea
                value={newFinding.recommendation_ar}
                onChange={(e) => setNewFinding({ ...newFinding, recommendation_ar: e.target.value })}
                placeholder="التوصيات لمعالجة هذه النتيجة..."
                rows={3}
              />
            </div>

            <div>
              <Label>وصف الأثر</Label>
              <Textarea
                value={newFinding.impact_description || ''}
                onChange={(e) => setNewFinding({ ...newFinding, impact_description: e.target.value })}
                placeholder="وصف الأثر المحتمل على المنظمة..."
                rows={2}
              />
            </div>

            <div>
              <Label>السبب الجذري</Label>
              <Textarea
                value={newFinding.root_cause || ''}
                onChange={(e) => setNewFinding({ ...newFinding, root_cause: e.target.value })}
                placeholder="تحليل السبب الجذري للمشكلة..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>مرجع الضابط</Label>
                <Input
                  value={newFinding.control_ref || ''}
                  onChange={(e) => setNewFinding({ ...newFinding, control_ref: e.target.value })}
                  placeholder="مثال: AC-2.1"
                />
              </div>

              <div>
                <Label>مرجع الإطار</Label>
                <Input
                  value={newFinding.framework_ref || ''}
                  onChange={(e) => setNewFinding({ ...newFinding, framework_ref: e.target.value })}
                  placeholder="مثال: NIST 800-53"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateFinding} disabled={isCreating}>
              {isCreating ? 'جارٍ الإضافة...' : 'إضافة النتيجة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Finding Card Component
interface FindingCardProps {
  finding: Finding;
  severityConfig: any;
  statusConfig: any;
  onStatusChange: (findingId: string, status: FindingStatus) => void;
}

function FindingCard({ finding, severityConfig, statusConfig, onStatusChange }: FindingCardProps) {
  const SeverityIcon = severityConfig[finding.severity].icon;
  const StatusIcon = statusConfig[finding.status].icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Severity Icon */}
          <div className={`p-2 rounded-lg ${severityConfig[finding.severity].color}`}>
            <SeverityIcon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={severityConfig[finding.severity].badgeVariant}>
                    {severityConfig[finding.severity].label}
                  </Badge>
                  <span className="text-sm font-mono text-muted-foreground">
                    {finding.category_code}
                  </span>
                </div>
                <h4 className="font-semibold">{finding.category_name_ar || finding.category_name}</h4>
              </div>

              <Select
                value={finding.status}
                onValueChange={(value) => onStatusChange(finding.id, value as FindingStatus)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      مفتوح
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      قيد المعالجة
                    </div>
                  </SelectItem>
                  <SelectItem value="resolved">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      تم الحل
                    </div>
                  </SelectItem>
                  <SelectItem value="accepted_risk">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      مخاطرة مقبولة
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm">{finding.finding_ar}</p>

            {finding.recommendation_ar && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">التوصية:</p>
                <p className="text-sm text-blue-800">{finding.recommendation_ar}</p>
              </div>
            )}

            {finding.control_ref && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>الضابط: {finding.control_ref}</span>
                {finding.framework_ref && <span>الإطار: {finding.framework_ref}</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
