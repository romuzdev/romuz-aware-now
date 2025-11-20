/**
 * SavedViewsPanel Component
 * Gate-M: Saved views management panel
 */

import { useState } from 'react';
import { useSavedViews, useSaveSavedView, useDeleteSavedView, useSetDefaultSavedView } from '../hooks';
import type { SavedEntityType } from '../types';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

interface SavedViewsPanelProps {
  entityType: SavedEntityType;
}

export function SavedViewsPanel({ entityType }: SavedViewsPanelProps) {
  const { tenantId, user } = useAppContext();
  const { data, isLoading } = useSavedViews(entityType);
  const save = useSaveSavedView();
  const setDefault = useSetDefaultSavedView();
  const remove = useDeleteSavedView();

  const [viewName, setViewName] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [isShared, setIsShared] = useState(false);

  async function handleCreate() {
    if (!tenantId || !user?.id) return;
    
    const payload = {
      tenantId: tenantId,
      entityType: entityType,
      viewName: viewName || 'Unnamed View',
      descriptionAr: descriptionAr || null,
      filters: {},
      sortConfig: { field: 'created_at', direction: 'desc' as const },
      isDefault: false,
      isShared: isShared,
      ownerId: user.id,
    };
    await save.mutateAsync(payload);
    setViewName(''); 
    setDescriptionAr(''); 
    setIsShared(false);
  }

  return (
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardHeader><CardTitle>حفظ منظور جديد</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label>اسم المنظور</Label><Input value={viewName} onChange={e=>setViewName(e.target.value)} /></div>
          <div><Label>الوصف (AR)</Label><Input value={descriptionAr} onChange={e=>setDescriptionAr(e.target.value)} /></div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={isShared} onCheckedChange={setIsShared} />
            <Label>مشاركة داخل التينانت</Label>
          </div>
          <div className="md:col-span-3">
            <Button onClick={handleCreate} disabled={save.isPending}>حفظ</Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border p-4">
        <div className="font-medium mb-3">المناظير المحفوظة</div>
        {isLoading && <div className="py-6 text-center">تحميل…</div>}
        {!isLoading && (data ?? []).length === 0 && <div className="py-6 text-center text-muted-foreground">لا توجد مناظير</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data ?? []).map(v=>(
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-base">{v.viewName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">{v.descriptionAr ?? '—'}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={()=>setDefault.mutate(v.id)}>تعيين افتراضي</Button>
                  <Button size="sm" variant="destructive" onClick={()=>remove.mutate(v.id)}>حذف</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SavedViewsPanel;
