import { useParams, Link as RouterLink } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useCan } from '@/core/rbac';
import { useCampaignById, useRealtimeCampaign } from '@/modules/campaigns';
import { useCampaignAuditLog } from '@/core/hooks/audit/useCampaignAuditLog';
import { useAuditRealtime } from '@/core/hooks/audit/useAuditRealtime';
import { useParticipantsList } from '@/modules/campaigns/hooks/participants/useParticipantsList';
import { useParticipantsActions } from '@/modules/campaigns/hooks/participants/useParticipantsActions';
import { useParticipantsMetrics } from '@/modules/campaigns/hooks/participants/useParticipantsMetrics';
import { useAwarenessTrend } from '@/modules/analytics/hooks/useAwarenessTrend';
import { useModules } from '@/modules/campaigns/hooks/modules/useModules';
import CampaignNotificationsPage from './Notifications';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { ParticipantsFilters } from '@/modules/campaigns/components/participants/ParticipantsFilters';
import { ParticipantsTable } from '@/modules/campaigns/components/participants/ParticipantsTable';
import { ParticipantsBulkToolbar } from '@/modules/campaigns/components/participants/ParticipantsBulkToolbar';
import { ParticipantsImportDialog } from '@/modules/campaigns/components/participants/ParticipantsImportDialog';
import { MetricsCards } from '@/modules/campaigns/components/participants/MetricsCards';
import { ModulesTable } from '@/modules/campaigns/components/modules/ModulesTable';
import { ModuleFormDialog } from '@/modules/campaigns/components/modules/ModuleFormDialog';
import { ModulePreviewDialog } from '@/modules/campaigns/components/modules/ModulePreviewDialog';
import { QuizTakeDialog } from '@/modules/campaigns/components/modules/QuizTakeDialog';
import { useToast } from '@/hooks/use-toast';
import { toCSV } from '@/lib/export/csv';
import type { ParticipantsFilters as FiltersType, ParticipantStatus } from '@/modules/campaigns';
import type { Module, ModuleFormData } from '@/modules/campaigns';
import { Download, Upload, Plus, FileText, Users, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/core/components/ui/alert-dialog';

const DEFAULT_FILTERS: FiltersType = {
  q: '',
  status: 'all',
  scoreGte: null,
  from: '',
  to: '',
  includeDeleted: false,
  sortBy: 'completed_at',
  sortDir: 'desc',
};

export default function CampaignDetailPage() {
  const { id = '' } = useParams();
  const can = useCan();
  const { toast } = useToast();
  const { data: campaign } = useCampaignById(id);
  
  const { data: audit, isLoading: auditLoading, error: auditError, refetch: refetchAudit } = useCampaignAuditLog(id);
  useAuditRealtime(id, () => { refetchAudit(); });
  useRealtimeCampaign(id);

  // Participants state
  const [filters, setFilters] = useState<FiltersType>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Dialogs
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'undelete' | null>(null);

  const { data: participantsData, isLoading: participantsLoading, refetch: refetchParticipants } = useParticipantsList({
    campaignId: id,
    filters,
    page,
    pageSize,
  });

  const { data: metricsData, isLoading: metricsLoading } = useParticipantsMetrics(id, campaign?.endDate);

  // Fetch daily engagement trend
  const trendFilters = useMemo(() => ({
    dateRange: 'custom' as const,
    campaignId: id,
    // Don't filter by dates to show all available data for the campaign
  }), [id]);
  
  const { data: trendData, isLoading: trendLoading } = useAwarenessTrend(trendFilters);

  const actions = useParticipantsActions();

  // Modules state
  const {
    modules,
    loading: modulesLoading,
    createModule,
    updateModule,
    deleteModule,
    moveUp,
    moveDown,
  } = useModules(id);

  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);
  const [quizTestModule, setQuizTestModule] = useState<string | null>(null);

  // Clear test data state
  const [clearTestDataOpen, setClearTestDataOpen] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  const participants = participantsData?.data ?? [];
  const total = participantsData?.total ?? 0;

  function updateFilters(patch: Partial<FiltersType>) {
    setFilters(prev => ({ ...prev, ...patch }));
    setPage(1);
    setSelected([]);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelected([]);
  }

  function toggleAll() {
    setSelected(selected.length === participants.length ? [] : participants.map(p => p.id));
  }

  function toggleOne(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function ensureAction(action: 'delete' | 'undelete') {
    const isDestructive = action === 'delete';
    const isLargeBatch = selected.length > 1000;

    if (isDestructive || isLargeBatch) {
      setConfirmAction(action);
      setConfirmOpen(true);
    } else {
      runAction(action);
    }
  }

  async function runAction(action: 'delete' | 'undelete') {
    try {
      if (action === 'delete') await actions.bulkDelete(selected);
      if (action === 'undelete') await actions.bulkUndelete(selected);
      setSelected([]);
      refetchParticipants();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    } finally {
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  }

  async function handleChangeStatus(status: ParticipantStatus) {
    try {
      await actions.bulkUpdate({ ids: selected, patch: { status } });
      setSelected([]);
      refetchParticipants();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    }
  }

  async function handleSetScore() {
    const score = scoreInput === '' ? null : Number(scoreInput);
    if (score !== null && (score < 0 || score > 100)) {
      toast({ variant: 'destructive', title: 'Score must be 0-100' });
      return;
    }

    try {
      await actions.bulkUpdate({ ids: selected, patch: { score } });
      setScoreDialogOpen(false);
      setScoreInput('');
      setSelected([]);
      refetchParticipants();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    }
  }

  async function handleSetNotes() {
    try {
      await actions.bulkUpdate({ ids: selected, patch: { notes: notesInput || null } });
      setNotesDialogOpen(false);
      setNotesInput('');
      setSelected([]);
      refetchParticipants();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    }
  }

  async function exportCSV() {
    try {
      setExporting(true);
      const { supabase } = await import('@/integrations/supabase/client');

      let q = supabase
        .from('campaign_participants')
        .select('employee_ref, status, score, completed_at, notes')
        .eq('campaign_id', id);

      if (!filters.includeDeleted) q = q.is('deleted_at', null);
      if (filters.q?.trim()) q = q.ilike('employee_ref', `%${filters.q.trim()}%`);
      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters.scoreGte !== null) q = q.gte('score', filters.scoreGte);
      if (filters.from) q = q.gte('completed_at', filters.from);
      if (filters.to) q = q.lte('completed_at', filters.to);

      const ascending = filters.sortDir === 'asc';
      q = q.order(filters.sortBy, { ascending });

      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);

      const csv = toCSV(rows ?? [], {
        employee_ref: 'Employee Ref',
        status: 'Status',
        score: 'Score',
        completed_at: 'Completed At',
        notes: 'Notes',
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const now = new Date();
      const YYYYMMDD = now.toISOString().slice(0, 10).replace(/-/g, '');
      const HHMM = now.toISOString().slice(11, 16).replace(/:/g, '');
      a.download = `campaign_${id}_participants_${YYYYMMDD}_${HHMM}.csv`;

      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: `Exported ${(rows ?? []).length} participant(s)` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export failed', description: e.message });
    } finally {
      setExporting(false);
    }
  }

  async function handleModuleSubmit(data: ModuleFormData) {
    if (editingModule) {
      await updateModule({ id: editingModule.id, formData: data });
    } else {
      await createModule(data);
    }
    setModuleFormOpen(false);
    setEditingModule(null);
  }

  function handleEditModule(module: Module) {
    setEditingModule(module);
    setModuleFormOpen(true);
  }

  async function handleDeleteModule(id: string) {
    if (!confirm('Delete this module?')) return;
    await deleteModule(id);
  }

  async function handleClearTestData() {
    try {
      setClearingData(true);
      const { supabase } = await import('@/integrations/supabase/client');

      // Delete test participants (those with employee_ref starting with EMP-TEST-)
      const { error: participantsError } = await supabase
        .from('campaign_participants')
        .delete()
        .eq('campaign_id', id)
        .ilike('employee_ref', 'EMP-TEST-%');

      if (participantsError) throw participantsError;

      // Delete test audit logs (optional - keep only if you want to clear audit too)
      const { error: auditError } = await supabase
        .from('audit_log')
        .delete()
        .eq('entity_type', 'campaign')
        .eq('entity_id', id)
        .or('action.ilike.%test%,action.ilike.%bulk_participants_imported%');

      if (auditError) console.warn('Could not clear audit logs:', auditError);

      toast({
        title: 'تم مسح البيانات التجريبية',
        description: 'تم حذف جميع البيانات التجريبية بنجاح',
      });

      // Refresh data
      refetchParticipants();
      refetchAudit();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'فشل مسح البيانات',
        description: e.message,
      });
    } finally {
      setClearingData(false);
      setClearTestDataOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{campaign?.name ?? 'Campaign'}</h1>
          <p className="text-sm text-muted-foreground">{campaign?.description ?? '—'}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <RouterLink to="/admin/campaigns">Back</RouterLink>
          </Button>
          <Button asChild disabled={!can('campaigns.manage')}>
            <RouterLink to={`/admin/campaigns/${id}/edit`}>Edit</RouterLink>
          </Button>
          {can('campaigns.manage') && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setClearTestDataOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              مسح البيانات التجريبية
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="space-y-4">
            {/* Campaign Details Card */}
            <div className="border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">التفاصيل</h3>
                {campaign?.description && (
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {campaign?.startDate && (
                  <div>
                    <p className="text-sm font-medium">تاريخ البدء</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(campaign.startDate).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {campaign?.endDate && (
                  <div>
                    <p className="text-sm font-medium">تاريخ الانتهاء</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(campaign.endDate).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {campaign?.ownerName && (
                  <div>
                    <p className="text-sm font-medium">المسؤول</p>
                    <p className="text-sm text-muted-foreground">{campaign.ownerName}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium">الحالة</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign?.status === 'draft' && 'مسودة'}
                    {campaign?.status === 'scheduled' && 'مجدولة'}
                    {campaign?.status === 'active' && 'نشطة'}
                    {campaign?.status === 'completed' && 'مكتملة'}
                    {campaign?.status === 'cancelled' && 'ملغاة'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">معلومات إضافية</h3>
                <div className="grid gap-2 text-sm">
                  {campaign?.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <span>{new Date(campaign.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                  {campaign?.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر تحديث:</span>
                      <span>{new Date(campaign.updatedAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">عدد الوحدات</p>
                <p className="text-2xl font-semibold">{modules.length}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">عدد المشاركين</p>
                <p className="text-2xl font-semibold">{total}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">معدل الإكمال</p>
                <p className="text-2xl font-semibold">
                  {metricsData && metricsData.total > 0
                    ? `${((metricsData.completed / metricsData.total) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>

            {/* Participants Status Distribution Chart */}
            {metricsData && metricsData.breakdown && (
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">توزيع حالات المشاركين</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'لم يبدأ', value: metricsData.breakdown.not_started, color: 'hsl(var(--muted))' },
                        { name: 'قيد التنفيذ', value: metricsData.breakdown.in_progress, color: 'hsl(var(--primary))' },
                        { name: 'مكتمل', value: metricsData.breakdown.completed, color: 'hsl(var(--chart-2))' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {[
                        { name: 'لم يبدأ', value: metricsData.breakdown.not_started, color: 'hsl(var(--muted))' },
                        { name: 'قيد التنفيذ', value: metricsData.breakdown.in_progress, color: 'hsl(var(--primary))' },
                        { name: 'مكتمل', value: metricsData.breakdown.completed, color: 'hsl(var(--chart-2))' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value} مشارك
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Daily Progress Trend Chart */}
            {!trendLoading && trendData && trendData.length > 0 && (
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">تقدم المشاركين عبر الزمن</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium mb-2">
                                {new Date(payload[0].payload.day).toLocaleDateString('ar-SA')}
                              </p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name}: {entry.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                    <Line
                      type="monotone"
                      dataKey="started_delta"
                      name="بدأوا"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed_delta"
                      name="أكملوا"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="content" className="pt-4 space-y-4">
          {can('campaigns.manage') && (
            <div className="flex justify-end">
              <Button onClick={() => { setEditingModule(null); setModuleFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add Module
              </Button>
            </div>
          )}

          {modulesLoading ? (
            <div className="text-sm text-muted-foreground">Loading modules...</div>
          ) : (
            <ModulesTable
              modules={modules}
              canManage={can('campaigns.manage')}
              onEdit={handleEditModule}
              onDelete={handleDeleteModule}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onPreview={(m) => setPreviewModule(m)}
            />
          )}
        </TabsContent>

        <TabsContent value="participants" className="pt-4 space-y-4">
          {/* Filters */}
          <ParticipantsFilters
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
            showIncludeDeleted={can('campaigns.manage')}
          />

          {/* Actions Bar */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
              disabled={!can('campaigns.manage')}
              title={!can('campaigns.manage') ? 'Insufficient permissions' : 'Import CSV'}
            >
              <Upload className="w-4 h-4 mr-1" />
              Import CSV
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={exportCSV}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-1" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>

            <div className="flex-1" />

            <Select
              value={pageSize.toString()}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Toolbar */}
          <ParticipantsBulkToolbar
            selectedCount={selected.length}
            onChangeStatus={handleChangeStatus}
            onSetScore={() => setScoreDialogOpen(true)}
            onSetNotes={() => setNotesDialogOpen(true)}
            onDelete={() => ensureAction('delete')}
            onUndelete={filters.includeDeleted ? () => ensureAction('undelete') : undefined}
            disabled={!can('campaigns.manage')}
            showUndelete={filters.includeDeleted}
          />

          {/* Table */}
          {participantsLoading ? (
            <div className="text-sm text-muted-foreground">Loading participants...</div>
          ) : (
            <ParticipantsTable
              data={participants}
              selected={selected}
              onToggleAll={toggleAll}
              onToggleOne={toggleOne}
            />
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="pt-4">
          <MetricsCards metrics={metricsData} loading={metricsLoading} />
        </TabsContent>

        <TabsContent value="notifications" className="pt-4">
          <CampaignNotificationsPage />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          {auditLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              ))}
            </div>
          )}
          
          {auditError && (
            <div className="border border-destructive rounded-lg p-4 bg-destructive/10">
              <p className="text-sm text-destructive">{auditError}</p>
            </div>
          )}
          
          {!auditLoading && !auditError && audit.length === 0 && (
            <div className="border rounded-lg p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">لا توجد أنشطة بعد</h3>
              <p className="text-sm text-muted-foreground">
                سيتم عرض سجل الأنشطة والتغييرات على الحملة هنا
              </p>
            </div>
          )}
          
          {!auditLoading && !auditError && audit.length > 0 && (
            <div className="space-y-2">
              {audit.map((item) => {
                const actionIcon = item.action.includes('create') ? Plus :
                                  item.action.includes('update') ? Settings :
                                  item.action.includes('delete') ? Trash2 :
                                  item.action.includes('participant') ? Users :
                                  FileText;
                
                const ActionIcon = actionIcon;
                
                return (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ActionIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium">{item.action}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString('ar-SA', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.actor ?? 'النظام'}
                        </p>
                        {item.payload && Object.keys(item.payload).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              عرض التفاصيل
                            </summary>
                            <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(item.payload, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Score</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            placeholder="0-100 (leave empty to clear)"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            min={0}
            max={100}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetScore}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Notes</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter notes (leave empty to clear)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetNotes}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {confirmAction} {selected.length} participant(s)?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => runAction(confirmAction!)}>
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ParticipantsImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        campaignId={id}
        onSuccess={refetchParticipants}
      />

      <ModuleFormDialog
        open={moduleFormOpen}
        onClose={() => { setModuleFormOpen(false); setEditingModule(null); }}
        onSubmit={handleModuleSubmit}
        module={editingModule}
      />

      <ModulePreviewDialog
        open={!!previewModule}
        onClose={() => setPreviewModule(null)}
        module={previewModule}
        onTestRunQuiz={(moduleId) => setQuizTestModule(moduleId)}
      />

      <QuizTakeDialog
        open={!!quizTestModule}
        onClose={() => setQuizTestModule(null)}
        moduleId={quizTestModule || ''}
        participantId="test-participant"
        campaignId={id}
        isTestRun={true}
      />

      {/* Clear Test Data Confirmation */}
      <AlertDialog open={clearTestDataOpen} onOpenChange={setClearTestDataOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              مسح البيانات التجريبية
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع المشاركين والأنشطة التي تبدأ بـ "EMP-TEST-" من هذه الحملة.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingData}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearTestData}
              disabled={clearingData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearingData ? 'جاري المسح...' : 'تأكيد المسح'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
