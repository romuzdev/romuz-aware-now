/**
 * API Key Manager Component
 * Gate-M15: Manage API keys for external access
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAPIKeys,
  createAPIKey,
  revokeAPIKey,
  deleteAPIKey,
} from '../integration';
import type { IntegrationAPIKey, APIKeyWithSecret } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';

export function APIKeyManager() {
  const { t } = useTranslation();
  const { tenantId } = useAppContext();
  const [apiKeys, setApiKeys] = useState<IntegrationAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    key_name: '',
    permissions: [] as string[],
    expires_at: '',
  });
  const [createdKey, setCreatedKey] = useState<APIKeyWithSecret | null>(null);

  useEffect(() => {
    loadAPIKeys();
  }, [tenantId]);

  const loadAPIKeys = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const data = await fetchAPIKeys(tenantId);
      setApiKeys(data);
    } catch (error: any) {
      toast.error('فشل تحميل API Keys', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!tenantId || !newKeyData.key_name) return;

    try {
      const result = await createAPIKey(tenantId, {
        key_name: newKeyData.key_name,
        permissions: newKeyData.permissions,
        expires_at: newKeyData.expires_at || undefined,
      });
      
      setCreatedKey(result);
      setNewKeyData({ key_name: '', permissions: [], expires_at: '' });
      loadAPIKeys();
    } catch (error: any) {
      toast.error('فشل إنشاء API Key', {
        description: error.message,
      });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('تم نسخ API Key');
  };

  const handleRevoke = async (keyId: string) => {
    if (!tenantId) return;
    if (!confirm('هل أنت متأكد من إلغاء هذا API Key؟')) return;

    try {
      await revokeAPIKey(tenantId, keyId);
      toast.success('تم إلغاء API Key');
      loadAPIKeys();
    } catch (error: any) {
      toast.error('فشل إلغاء API Key', {
        description: error.message,
      });
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!tenantId) return;
    if (!confirm('هل أنت متأكد من حذف هذا API Key نهائياً؟')) return;

    try {
      await deleteAPIKey(tenantId, keyId);
      toast.success('تم حذف API Key');
      loadAPIKeys();
    } catch (error: any) {
      toast.error('فشل حذف API Key', {
        description: error.message,
      });
    }
  };

  const togglePermission = (permission: string) => {
    setNewKeyData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const availablePermissions = [
    'read:connectors',
    'write:connectors',
    'read:logs',
    'trigger:sync',
    'manage:webhooks',
  ];

  if (!tenantId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">لم يتم العثور على معرف الجهة</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة API Keys</h2>
          <p className="text-muted-foreground">
            مفاتيح الوصول للأنظمة الخارجية
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء API Key
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">لا توجد API Keys بعد</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{key.key_name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                        {key.status === 'active' ? 'نشط' : key.status === 'revoked' ? 'ملغي' : 'منتهي'}
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.key_prefix}...
                      </code>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {key.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(key.id)}
                      >
                        إلغاء
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  {key.permissions.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">الصلاحيات:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {key.permissions.map((perm, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>تم الإنشاء: {new Date(key.created_at).toLocaleDateString('ar')}</span>
                    {key.last_used_at && (
                      <span>آخر استخدام: {new Date(key.last_used_at).toLocaleDateString('ar')}</span>
                    )}
                    {key.expires_at && (
                      <span>ينتهي: {new Date(key.expires_at).toLocaleDateString('ar')}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) setCreatedKey(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? 'API Key تم إنشاؤه' : 'إنشاء API Key جديد'}
            </DialogTitle>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2 font-semibold">
                  ⚠️ احفظ هذا المفتاح الآن! لن تتمكن من رؤيته مرة أخرى.
                </p>
              </div>

              <div>
                <Label>API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={createdKey.api_key} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyKey(createdKey.api_key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={() => {
                setCreatedKey(null);
                setIsCreateModalOpen(false);
              }} className="w-full">
                تم
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="key_name">اسم المفتاح</Label>
                <Input
                  id="key_name"
                  value={newKeyData.key_name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, key_name: e.target.value })}
                  placeholder="مثال: Production API Key"
                />
              </div>

              <div>
                <Label>الصلاحيات</Label>
                <div className="space-y-2 mt-2">
                  {availablePermissions.map((perm) => (
                    <div key={perm} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={perm}
                        checked={newKeyData.permissions.includes(perm)}
                        onCheckedChange={() => togglePermission(perm)}
                      />
                      <Label htmlFor={perm} className="text-sm font-normal cursor-pointer">
                        {perm}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="expires_at">تاريخ الانتهاء (اختياري)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={newKeyData.expires_at}
                  onChange={(e) => setNewKeyData({ ...newKeyData, expires_at: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreate} disabled={!newKeyData.key_name}>
                  إنشاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
