/**
 * M25 - Health Score Card Component
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Heart,
  Users,
  FileText,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { Badge } from '@/core/components/ui/badge';
import type { HealthSnapshot } from '../types';

interface HealthScoreCardProps {
  snapshot: HealthSnapshot | null;
  trend: HealthSnapshot[];
  onRecompute: () => void;
  isRecomputing: boolean;
}

export function HealthScoreCard({ snapshot, trend, onRecompute, isRecomputing }: HealthScoreCardProps) {
  if (!snapshot) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">لا توجد بيانات صحة متاحة</p>
            <Button onClick={onRecompute} disabled={isRecomputing}>
              {isRecomputing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              حساب نقاط الصحة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dimensions = [
    {
      key: 'adoption',
      name: 'التبني والاستخدام',
      score: snapshot.adoption_score,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      key: 'dataQuality',
      name: 'جودة البيانات',
      score: snapshot.data_quality_score,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      key: 'compliance',
      name: 'الامتثال',
      score: snapshot.compliance_score,
      icon: Shield,
      color: 'text-purple-600',
    },
    {
      key: 'riskHygiene',
      name: 'إدارة المخاطر',
      score: snapshot.risk_hygiene_score,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      excellent: { label: 'ممتاز', variant: 'default' as const },
      good: { label: 'جيد', variant: 'secondary' as const },
      needs_attention: { label: 'يحتاج انتباه', variant: 'outline' as const },
      critical: { label: 'حرج', variant: 'destructive' as const },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.needs_attention;
  };

  const statusBadge = getStatusBadge(snapshot.health_status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            نقاط الصحة الإجمالية
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRecompute}
            disabled={isRecomputing}
          >
            {isRecomputing && <RefreshCw className="w-4 h-4 ml-2 animate-spin" />}
            إعادة الحساب
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-6xl font-bold mb-2">{snapshot.overall_score}</div>
          <Badge variant={statusBadge.variant} className="text-lg px-4 py-1">
            {statusBadge.label}
          </Badge>
        </div>

        {/* Dimension Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dimension) => {
            const Icon = dimension.icon;
            return (
              <div key={dimension.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${dimension.color}`} />
                    <span className="text-sm font-medium">{dimension.name}</span>
                  </div>
                  <span className="text-sm font-bold">{dimension.score}%</span>
                </div>
                <Progress value={dimension.score} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Issues Summary */}
        {(snapshot.critical_issues_count > 0 || snapshot.recommendations_count > 0) && (
          <div className="flex gap-4 pt-4 border-t">
            {snapshot.critical_issues_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>{snapshot.critical_issues_count} مشاكل حرجة</span>
              </div>
            )}
            {snapshot.recommendations_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{snapshot.recommendations_count} توصية</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
