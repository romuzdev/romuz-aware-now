/**
 * Automated Compliance Gaps Page
 * Phase 3: GRC Enhancement - AI-Powered Gap Detection
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  AlertTriangle, 
  Zap, 
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { useAutomatedComplianceGaps } from '@/modules/grc';
import { ControlMappingSuggestions } from '../components/compliance/ControlMappingSuggestions';
import { RemediationPlanDialog } from '../components/compliance/RemediationPlanDialog';
import { BulkRemediationDialog } from '../components/compliance/BulkRemediationDialog';

export default function AutomatedComplianceGaps() {
  const [searchParams] = useSearchParams();
  const frameworkId = searchParams.get('framework') || undefined;
  
  const [selectedGapIds, setSelectedGapIds] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedGapForMapping, setSelectedGapForMapping] = useState<string | null>(null);
  const [selectedGapForPlan, setSelectedGapForPlan] = useState<any>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const { data: gaps, isLoading, refetch } = useAutomatedComplianceGaps(frameworkId);

  const handleSelectGap = (gapId: string, checked: boolean) => {
    setSelectedGapIds(prev => 
      checked ? [...prev, gapId] : prev.filter(id => id !== gapId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedGapIds(checked ? (filteredGaps?.map(g => g.gap_id) || []) : []);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200',
    };
    return colors[severity] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSeverityIcon = (severity: string) => {
    const size = severity === 'critical' ? 'h-5 w-5' : 'h-4 w-4';
    return <AlertTriangle className={size} />;
  };

  // Filter gaps
  const filteredGaps = gaps?.filter(gap => {
    if (filterSeverity !== 'all' && gap.gap_severity !== filterSeverity) return false;
    if (filterType !== 'all' && gap.gap_type !== filterType) return false;
    return true;
  });

  const criticalCount = filteredGaps?.filter(g => g.gap_severity === 'critical').length || 0;
  const highCount = filteredGaps?.filter(g => g.gap_severity === 'high').length || 0;
  const totalEffort = filteredGaps?.reduce((sum, g) => sum + g.estimated_effort_days, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">جاري اكتشاف الفجوات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              الفجوات المكتشفة تلقائياً
            </h1>
            <p className="text-muted-foreground">
              فجوات الامتثال المكتشفة بواسطة الذكاء الاصطناعي مع اقتراحات المعالجة
            </p>
          </div>
          <div className="flex gap-2">
            {selectedGapIds.length > 0 && (
              <Button 
                variant="default"
                onClick={() => setShowBulkDialog(true)}
              >
                <Zap className="ml-2 h-4 w-4" />
                معالجة جماعية ({selectedGapIds.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => refetch()}>
              <Zap className="ml-2 h-4 w-4" />
              إعادة الكشف
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفجوات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredGaps?.length || 0}</div>
            <p className="text-xs text-muted-foreground">فجوة مكتشفة</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فجوات حرجة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">تتطلب إجراء فوري</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عالية الخطورة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highCount}</div>
            <p className="text-xs text-muted-foreground">أولوية عالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الجهد المقدر</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEffort}</div>
            <p className="text-xs text-muted-foreground">يوم عمل للمعالجة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="جميع الخطورات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الخطورات</SelectItem>
                <SelectItem value="critical">حرجة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="missing_controls">ضوابط مفقودة</SelectItem>
                <SelectItem value="ineffective_controls">ضوابط غير فعالة</SelectItem>
                <SelectItem value="documentation_gap">فجوة توثيق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gaps Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>الفجوات المكتشفة</CardTitle>
              <CardDescription>
                قائمة مفصلة بفجوات الامتثال مع اقتراحات المعالجة
              </CardDescription>
            </div>
            {filteredGaps && filteredGaps.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedGapIds.length === filteredGaps.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">تحديد الكل</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredGaps && filteredGaps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>المتطلب</TableHead>
                  <TableHead>الفجوة</TableHead>
                  <TableHead>الخطورة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الجهد المقدر</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGaps.map((gap) => (
                  <TableRow key={gap.gap_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGapIds.includes(gap.gap_id)}
                        onCheckedChange={(checked) => 
                          handleSelectGap(gap.gap_id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{gap.requirement_code}</div>
                        <div className="text-sm text-muted-foreground">
                          {gap.requirement_title}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {gap.framework_name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm">{gap.gap_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 {gap.recommended_action}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 w-fit ${getSeverityColor(gap.gap_severity)}`}
                      >
                        {getSeverityIcon(gap.gap_severity)}
                        {gap.gap_severity === 'critical' && 'حرجة'}
                        {gap.gap_severity === 'high' && 'عالية'}
                        {gap.gap_severity === 'medium' && 'متوسطة'}
                        {gap.gap_severity === 'low' && 'منخفضة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{gap.gap_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {gap.estimated_effort_days} يوم
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedGapForMapping(gap.requirement_id)}
                        >
                          <LinkIcon className="h-4 w-4 ml-1" />
                          ربط
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedGapForPlan(gap)}
                        >
                          <FileText className="h-4 w-4 ml-1" />
                          خطة
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد فجوات امتثال!</p>
              <p className="text-sm text-muted-foreground mt-2">
                جميع المتطلبات ممتثلة بشكل كامل
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Mapping Suggestions Dialog */}
      {selectedGapForMapping && (
        <ControlMappingSuggestions
          requirementId={selectedGapForMapping}
          open={!!selectedGapForMapping}
          onClose={() => setSelectedGapForMapping(null)}
          onSuccess={() => {
            setSelectedGapForMapping(null);
            refetch();
          }}
        />
      )}

      {/* Remediation Plan Dialog */}
      {selectedGapForPlan && (
        <RemediationPlanDialog
          gap={selectedGapForPlan}
          open={!!selectedGapForPlan}
          onClose={() => setSelectedGapForPlan(null)}
        />
      )}

      {/* Bulk Remediation Dialog */}
      {showBulkDialog && (
        <BulkRemediationDialog
          selectedGaps={filteredGaps?.filter(g => selectedGapIds.includes(g.gap_id)) || []}
          open={showBulkDialog}
          onClose={() => setShowBulkDialog(false)}
          onSuccess={() => {
            setShowBulkDialog(false);
            setSelectedGapIds([]);
            refetch();
          }}
        />
      )}
    </div>
  );
}
