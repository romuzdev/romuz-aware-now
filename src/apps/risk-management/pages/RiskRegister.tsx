/**
 * GRC Platform - Risk Register Page
 * Main page for viewing and managing the risk register
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { useRisks, useDeleteRisk } from '@/modules/grc/hooks/useRisks';
import { RiskForm, RiskMatrix } from '../components';
import type { RiskFilters, Risk } from '@/modules/grc/types';

export default function RiskRegister() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RiskFilters>({
    sortBy: 'risk_code',
    sortDir: 'desc',
  });
  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>();

  const { data: risks, isLoading } = useRisks(filters);
  const deleteMutation = useDeleteRisk();

  const handleDelete = async (riskId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المخاطرة?')) {
      await deleteMutation.mutateAsync(riskId);
    }
  };

  const getRiskLevelBadge = (score: number) => {
    if (score > 16)
      return (
        <Badge className="bg-destructive/10 text-destructive">عالية جداً</Badge>
      );
    if (score > 12)
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
          عالية
        </Badge>
      );
    if (score > 8)
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          متوسطة
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
        منخفضة
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل المخاطر</h1>
          <p className="text-muted-foreground">
            إدارة وتتبع المخاطر المؤسسية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setViewMode(viewMode === 'table' ? 'matrix' : 'table')
            }
          >
            {viewMode === 'table' ? 'عرض المصفوفة' : 'عرض الجدول'}
          </Button>
          <Button onClick={() => setIsCreateFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة مخاطرة جديدة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="البحث في المخاطر..."
          className="max-w-sm"
          value={filters.q || ''}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />

        <Select
          value={filters.risk_category || 'all'}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              risk_category: value === 'all' ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="strategic">استراتيجية</SelectItem>
            <SelectItem value="operational">تشغيلية</SelectItem>
            <SelectItem value="financial">مالية</SelectItem>
            <SelectItem value="compliance">امتثال</SelectItem>
            <SelectItem value="reputational">سمعة</SelectItem>
            <SelectItem value="technology">تقنية</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.risk_status || 'all'}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              risk_status: value === 'all' ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="identified">محددة</SelectItem>
            <SelectItem value="assessed">مقيّمة</SelectItem>
            <SelectItem value="treated">معالجة</SelectItem>
            <SelectItem value="monitored">مراقبة</SelectItem>
            <SelectItem value="closed">مغلقة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content - Table or Matrix */}
      {viewMode === 'matrix' && risks ? (
        <RiskMatrix
          risks={risks}
          onRiskClick={(risk) => navigate(`/risk/register/${risk.id}`)}
        />
      ) : (
        <div className="bg-card rounded-lg border">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : !risks || risks.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              لا توجد مخاطر مسجلة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الاحتمالية</TableHead>
                  <TableHead className="text-center">التأثير</TableHead>
                  <TableHead className="text-center">النقاط</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((risk) => (
                  <TableRow key={risk.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell
                      className="font-mono text-sm"
                    onClick={() => navigate(`/risk/register/${risk.id}`)}
                    >
                      {risk.risk_code}
                    </TableCell>
                    <TableCell
                    onClick={() => navigate(`/risk/register/${risk.id}`)}
                      className="font-medium"
                    >
                      {risk.risk_title}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/risk/register/${risk.id}`)}>
                      <Badge variant="outline">{risk.risk_category}</Badge>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/risk/register/${risk.id}`)}>
                      <Badge variant="outline">{risk.risk_status}</Badge>
                    </TableCell>
                    <TableCell
                      className="text-center"
                    onClick={() => navigate(`/risk/register/${risk.id}`)}
                    >
                      {risk.likelihood_score}
                    </TableCell>
                    <TableCell
                      className="text-center"
                    onClick={() => navigate(`/risk/register/${risk.id}`)}
                    >
                      {risk.impact_score}
                    </TableCell>
                    <TableCell
                      className="text-center font-bold"
                    onClick={() => navigate(`/risk/register/${risk.id}`)}
                    >
                      {risk.inherent_risk_score}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/risk/register/${risk.id}`)}>
                      {getRiskLevelBadge(risk.inherent_risk_score)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                    onClick={() => navigate(`/risk/register/${risk.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRisk(risk)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(risk.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Create Form Dialog */}
      <RiskForm
        open={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        mode="create"
      />

      {/* Edit Form Dialog */}
      {editingRisk && (
        <RiskForm
          open={!!editingRisk}
          onOpenChange={(open) => !open && setEditingRisk(undefined)}
          risk={editingRisk}
          mode="edit"
        />
      )}
    </div>
  );
}
