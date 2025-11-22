/**
 * Enhanced GRC Dashboard
 * Comprehensive overview of Governance, Risk & Compliance
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import { useRisks, useControls, useAudits } from '@/modules/grc/hooks';
import { Link } from 'react-router-dom';

export default function GRCDashboard() {
  const { data: risks } = useRisks();
  const { data: controls } = useControls();
  const { data: audits } = useAudits();

  // Calculate metrics
  const totalRisks = risks?.length || 0;
  const criticalRisks = risks?.filter(r => r.inherent_risk_score >= 20).length || 0;
  const highRisks = risks?.filter(r => r.inherent_risk_score >= 15 && r.inherent_risk_score < 20).length || 0;
  
  const totalControls = controls?.length || 0;
  const effectiveControls = controls?.filter(c => c.effectiveness_rating === 'effective').length || 0;
  const effectivenessRate = totalControls > 0 ? (effectiveControls / totalControls * 100).toFixed(1) : '0';

  const activeAudits = audits?.filter(a => a.audit_status === 'in_progress').length || 0;
  const completedAudits = audits?.filter(a => a.audit_status === 'completed').length || 0;

  const overviewCards = [
    {
      title: 'إجمالي المخاطر',
      value: totalRisks,
      change: '+12%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'مخاطر حرجة',
      value: criticalRisks,
      change: '-5%',
      trend: 'down',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'فعالية الضوابط',
      value: `${effectivenessRate}%`,
      change: '+8%',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'التدقيقات النشطة',
      value: activeAudits,
      change: '0%',
      trend: 'neutral',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  const mediumRisks = risks?.filter(r => r.inherent_risk_score >= 9 && r.inherent_risk_score < 15).length || 0;
  const lowRisks = risks?.filter(r => r.inherent_risk_score < 9).length || 0;
  
  const riskDistribution = [
    { level: 'حرجة', count: criticalRisks, color: 'bg-red-500', percentage: totalRisks > 0 ? (criticalRisks / totalRisks * 100).toFixed(0) : '0' },
    { level: 'عالية', count: highRisks, color: 'bg-orange-500', percentage: totalRisks > 0 ? (highRisks / totalRisks * 100).toFixed(0) : '0' },
    { level: 'متوسطة', count: mediumRisks, color: 'bg-yellow-500', percentage: totalRisks > 0 ? (mediumRisks / totalRisks * 100).toFixed(0) : '0' },
    { level: 'منخفضة', count: lowRisks, color: 'bg-green-500', percentage: totalRisks > 0 ? (lowRisks / totalRisks * 100).toFixed(0) : '0' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة تحكم GRC</h1>
          <p className="text-muted-foreground mt-2">
            نظرة شاملة على الحوكمة والمخاطر والامتثال
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/grc/reports">
              <FileText className="ml-2 h-4 w-4" />
              التقارير
            </Link>
          </Button>
          <Button asChild>
            <Link to="/grc/framework-mapping">
              <Target className="ml-2 h-4 w-4" />
              ربط الأطر
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {card.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {card.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span>{card.change} من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risks">المخاطر</TabsTrigger>
          <TabsTrigger value="controls">الضوابط</TabsTrigger>
          <TabsTrigger value="audits">التدقيقات</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="space-y-4">
          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                توزيع المخاطر
              </CardTitle>
              <CardDescription>توزيع المخاطر حسب المستوى</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskDistribution.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.level}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Risks */}
          <Card>
            <CardHeader>
              <CardTitle>أعلى المخاطر</CardTitle>
              <CardDescription>المخاطر ذات الأولوية العالية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks?.slice(0, 5).map((risk) => {
                  const riskLevel = risk.inherent_risk_score >= 20 ? 'critical' : 
                                   risk.inherent_risk_score >= 15 ? 'high' : 
                                   risk.inherent_risk_score >= 9 ? 'medium' : 'low';
                  return (
                    <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{risk.risk_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{risk.risk_category}</p>
                      </div>
                      <Badge variant={
                        riskLevel === 'critical' ? 'destructive' :
                        riskLevel === 'high' ? 'default' : 'secondary'
                      }>
                        {riskLevel}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                أداء الضوابط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{totalControls}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الضوابط</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{effectiveControls}</p>
                  <p className="text-sm text-muted-foreground">فعالة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{effectivenessRate}%</p>
                  <p className="text-sm text-muted-foreground">معدل الفعالية</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                حالة التدقيقات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{activeAudits}</p>
                  <p className="text-sm text-muted-foreground">تدقيقات نشطة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{completedAudits}</p>
                  <p className="text-sm text-muted-foreground">تدقيقات مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>حالة الامتثال</CardTitle>
              <CardDescription>نظرة عامة على حالة الامتثال للأطر</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>سيتم إضافة بيانات الامتثال قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
