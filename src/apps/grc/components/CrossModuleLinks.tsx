/**
 * GRC Cross-Module Links Component
 * Integration links to other platform modules
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { 
  FileText, 
  Target, 
  Users, 
  TrendingUp,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CrossModuleLinksProps {
  entityType?: 'risk' | 'control' | 'compliance';
  entityId?: string;
  showAll?: boolean;
}

export function CrossModuleLinks({ 
  entityType, 
  entityId,
  showAll = false 
}: CrossModuleLinksProps) {
  // Mock data for cross-module relationships
  const linkedPolicies = [
    { id: 'p1', code: 'SEC-001', name: 'سياسة أمن المعلومات', status: 'active' },
    { id: 'p2', code: 'COM-002', name: 'سياسة الامتثال', status: 'active' },
  ];

  const linkedActions = [
    { id: 'a1', title: 'تحديث ضوابط الوصول', priority: 'high', status: 'in_progress' },
    { id: 'a2', title: 'مراجعة السياسات', priority: 'medium', status: 'pending' },
  ];

  const linkedCommittees = [
    { id: 'c1', name: 'لجنة إدارة المخاطر', nextMeeting: '2025-04-15' },
    { id: 'c2', name: 'لجنة الامتثال', nextMeeting: '2025-04-20' },
  ];

  const linkedKPIs = [
    { id: 'k1', name: 'مؤشر فعالية الضوابط', value: 87, target: 90, trend: 'up' },
    { id: 'k2', name: 'معدل الامتثال', value: 92, target: 95, trend: 'stable' },
  ];

  if (!showAll && !entityType) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Linked Policies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>السياسات المرتبطة</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/policies">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            السياسات المرتبطة بهذا {entityType === 'risk' ? 'المخاطر' : 'العنصر'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linkedPolicies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{policy.code}</Badge>
                  <div>
                    <p className="font-medium">{policy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      الحالة: {policy.status === 'active' ? 'نشط' : 'غير نشط'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/policies/${policy.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Linked Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>الإجراءات المرتبطة</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/actions">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            الإجراءات التصحيحية والوقائية المرتبطة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linkedActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'}>
                    {action.priority === 'high' ? 'عالية' : 'متوسطة'}
                  </Badge>
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-muted-foreground">
                      الحالة: {action.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/actions/${action.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Linked Committees */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>اللجان المرتبطة</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/committees">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            اللجان المعنية بمراجعة هذا {entityType === 'risk' ? 'المخاطر' : 'العنصر'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linkedCommittees.map((committee) => (
              <div
                key={committee.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{committee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    الاجتماع القادم: {new Date(committee.nextMeeting).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/committees/${committee.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Linked KPIs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>مؤشرات الأداء المرتبطة</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/kpis">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            مؤشرات الأداء الرئيسية ذات الصلة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linkedKPIs.map((kpi) => (
              <div
                key={kpi.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{kpi.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>القيمة: {kpi.value}%</span>
                    <span>الهدف: {kpi.target}%</span>
                    <Badge variant={kpi.trend === 'up' ? 'default' : 'secondary'}>
                      {kpi.trend === 'up' ? '↑ تحسن' : '→ مستقر'}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/kpis/${kpi.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
