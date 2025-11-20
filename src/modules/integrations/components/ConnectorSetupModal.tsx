/**
 * Connector Setup Modal
 * Gate-M15: Configure integration connectors
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import type { ConnectorType, CreateConnectorInput } from '../types';
import { Loader2 } from 'lucide-react';

interface ConnectorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateConnectorInput) => Promise<void>;
}

export function ConnectorSetupModal({ isOpen, onClose, onSubmit }: ConnectorSetupModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateConnectorInput>({
    name: '',
    description: '',
    type: 'slack',
    config: {},
    sync_frequency_minutes: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        name: '',
        description: '',
        type: 'slack',
        config: {},
        sync_frequency_minutes: 60,
      });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'slack':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, webhook_url: e.target.value }
                })}
                placeholder="https://hooks.slack.com/services/..."
                required
              />
            </div>
            <div>
              <Label htmlFor="channel">قناة (اختياري)</Label>
              <Input
                id="channel"
                value={formData.config.channel || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, channel: e.target.value }
                })}
                placeholder="#general"
              />
            </div>
          </div>
        );
      
      case 'google_workspace':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client_id">Client ID</Label>
              <Input
                id="client_id"
                value={formData.config.client_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, client_id: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="client_secret">Client Secret</Label>
              <Input
                id="client_secret"
                type="password"
                value={formData.config.client_secret || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, client_secret: e.target.value }
                })}
                required
              />
            </div>
          </div>
        );

      case 'odoo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Odoo URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.config.url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, url: e.target.value }
                })}
                placeholder="https://your-odoo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                value={formData.config.database || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, database: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={formData.config.username || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, username: e.target.value }
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.config.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value }
                })}
                required
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label htmlFor="base_url">Base URL</Label>
            <Input
              id="base_url"
              type="url"
              value={formData.config.base_url || ''}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, base_url: e.target.value }
              })}
              required
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة تكامل جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: إشعارات Slack"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف مختصر للتكامل"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">نوع التكامل</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ConnectorType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="google_workspace">Google Workspace</SelectItem>
                <SelectItem value="odoo">Odoo ERP</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="api">API خارجي</SelectItem>
                <SelectItem value="custom">مخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderConfigFields()}

          <div>
            <Label htmlFor="sync_frequency">تكرار المزامنة (بالدقائق)</Label>
            <Input
              id="sync_frequency"
              type="number"
              min="1"
              value={formData.sync_frequency_minutes}
              onChange={(e) => setFormData({
                ...formData,
                sync_frequency_minutes: parseInt(e.target.value) || 60
              })}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التكامل
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
