/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Component: Disaster Recovery Planner
 * Purpose: Manage disaster recovery plans and compliance
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Shield, Clock, Database, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import { Switch } from '@/core/components/ui/switch';
import { toast } from 'sonner';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchDRPlans,
  createDRPlan,
  updateDRPlan,
  deleteDRPlan,
  getDRPlanCompliance,
  type DisasterRecoveryPlan,
} from '@/integrations/supabase/disaster-recovery';

export function DisasterRecoveryPlanner() {
  const { t } = useTranslation();
  const { tenantId, user } = useAppContext();
  const userId = user?.id;
  const [plans, setPlans] = useState<DisasterRecoveryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DisasterRecoveryPlan | null>(null);

  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    rto_minutes: 240,
    rpo_minutes: 60,
    backup_frequency: 'daily',
    retention_days: 30,
    test_frequency: 'monthly',
    notification_emails: '',
    alert_on_failure: true,
    alert_on_test_due: true,
    priority: 'medium',
    is_active: true,
  });

  useEffect(() => {
    if (tenantId) {
      loadPlans();
    }
  }, [tenantId]);

  async function loadPlans() {
    if (!tenantId) return;

    try {
      setLoading(true);
      const data = await fetchDRPlans(tenantId);
      setPlans(data);
    } catch (error: any) {
      toast.error(t('backup.drPlans.loadError'), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !userId) return;

    try {
      const planData = {
        ...formData,
        tenant_id: tenantId,
        created_by: userId,
        updated_by: userId,
        notification_emails: formData.notification_emails
          .split(',')
          .map(e => e.trim())
          .filter(Boolean),
        backup_types: ['full', 'incremental'],
      };

      if (editingPlan) {
        await updateDRPlan(editingPlan.id, planData);
        toast.success(t('backup.drPlans.updateSuccess'));
      } else {
        await createDRPlan(planData);
        toast.success(t('backup.drPlans.createSuccess'));
      }

      setDialogOpen(false);
      resetForm();
      loadPlans();
    } catch (error: any) {
      toast.error(
        editingPlan
          ? t('backup.drPlans.updateError')
          : t('backup.drPlans.createError'),
        { description: error.message }
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('backup.drPlans.deleteConfirm'))) return;

    try {
      await deleteDRPlan(id);
      toast.success(t('backup.drPlans.deleteSuccess'));
      loadPlans();
    } catch (error: any) {
      toast.error(t('backup.drPlans.deleteError'), {
        description: error.message,
      });
    }
  }

  function handleEdit(plan: DisasterRecoveryPlan) {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      description: plan.description || '',
      rto_minutes: plan.rto_minutes,
      rpo_minutes: plan.rpo_minutes,
      backup_frequency: plan.backup_frequency,
      retention_days: plan.retention_days,
      test_frequency: plan.test_frequency,
      notification_emails: plan.notification_emails.join(', '),
      alert_on_failure: plan.alert_on_failure,
      alert_on_test_due: plan.alert_on_test_due,
      priority: plan.priority,
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  }

  function resetForm() {
    setEditingPlan(null);
    setFormData({
      plan_name: '',
      description: '',
      rto_minutes: 240,
      rpo_minutes: 60,
      backup_frequency: 'daily',
      retention_days: 30,
      test_frequency: 'monthly',
      notification_emails: '',
      alert_on_failure: true,
      alert_on_test_due: true,
      priority: 'medium',
      is_active: true,
    });
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('backup.drPlans.title')}</h2>
          <p className="text-muted-foreground">
            {t('backup.drPlans.description')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              {t('backup.drPlans.create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan
                  ? t('backup.drPlans.edit')
                  : t('backup.drPlans.create')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan_name">
                  {t('backup.drPlans.fields.planName')}
                </Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={e =>
                    setFormData({ ...formData, plan_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('backup.drPlans.fields.description')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rto_minutes">
                    {t('backup.drPlans.fields.rto')}
                  </Label>
                  <Input
                    id="rto_minutes"
                    type="number"
                    value={formData.rto_minutes}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rto_minutes: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('backup.drPlans.fields.rtoHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rpo_minutes">
                    {t('backup.drPlans.fields.rpo')}
                  </Label>
                  <Input
                    id="rpo_minutes"
                    type="number"
                    value={formData.rpo_minutes}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rpo_minutes: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('backup.drPlans.fields.rpoHint')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">
                    {t('backup.drPlans.fields.backupFrequency')}
                  </Label>
                  <Select
                    value={formData.backup_frequency}
                    onValueChange={value =>
                      setFormData({ ...formData, backup_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{t('backup.frequency.hourly')}</SelectItem>
                      <SelectItem value="daily">{t('backup.frequency.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('backup.frequency.weekly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention_days">
                    {t('backup.drPlans.fields.retentionDays')}
                  </Label>
                  <Input
                    id="retention_days"
                    type="number"
                    value={formData.retention_days}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        retention_days: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test_frequency">
                    {t('backup.drPlans.fields.testFrequency')}
                  </Label>
                  <Select
                    value={formData.test_frequency}
                    onValueChange={value =>
                      setFormData({ ...formData, test_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{t('backup.frequency.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('backup.frequency.monthly')}</SelectItem>
                      <SelectItem value="quarterly">{t('backup.frequency.quarterly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    {t('backup.drPlans.fields.priority')}
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={value =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('backup.priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('backup.priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('backup.priority.high')}</SelectItem>
                      <SelectItem value="critical">{t('backup.priority.critical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification_emails">
                  {t('backup.drPlans.fields.notificationEmails')}
                </Label>
                <Input
                  id="notification_emails"
                  value={formData.notification_emails}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      notification_emails: e.target.value,
                    })
                  }
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  {t('backup.drPlans.fields.emailsHint')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="alert_on_failure"
                    checked={formData.alert_on_failure}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, alert_on_failure: checked })
                    }
                  />
                  <Label htmlFor="alert_on_failure">
                    {t('backup.drPlans.fields.alertOnFailure')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="alert_on_test_due"
                    checked={formData.alert_on_test_due}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, alert_on_test_due: checked })
                    }
                  />
                  <Label htmlFor="alert_on_test_due">
                    {t('backup.drPlans.fields.alertOnTestDue')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">
                    {t('backup.drPlans.fields.isActive')}
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {editingPlan ? t('common.save') : t('common.create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {t('backup.drPlans.noPlan s')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('backup.drPlans.noPlansDescription')}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('backup.drPlans.createFirst')}
            </Button>
          </Card>
        ) : (
          plans.map(plan => (
            <Card key={plan.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{plan.plan_name}</h3>
                    <Badge variant={getPriorityColor(plan.priority)}>
                      {t(`backup.priority.${plan.priority}`)}
                    </Badge>
                    {plan.is_active && (
                      <Badge variant="default">{t('backup.status.active')}</Badge>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {plan.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">RTO</div>
                        <div className="text-muted-foreground">
                          {plan.rto_minutes} {t('backup.minutes')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">RPO</div>
                        <div className="text-muted-foreground">
                          {plan.rpo_minutes} {t('backup.minutes')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{t('backup.drPlans.fields.backupFrequency')}</div>
                        <div className="text-muted-foreground">
                          {t(`backup.frequency.${plan.backup_frequency}`)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{t('backup.drPlans.fields.testFrequency')}</div>
                        <div className="text-muted-foreground">
                          {t(`backup.frequency.${plan.test_frequency}`)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {plan.last_test_status && (
                <div className="pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {t('backup.drPlans.lastTest')}:
                    </span>{' '}
                    <Badge
                      variant={
                        plan.last_test_status === 'passed'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {plan.last_test_status}
                    </Badge>
                    {plan.last_test_date && (
                      <span className="text-muted-foreground ml-2">
                        {new Date(plan.last_test_date).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
