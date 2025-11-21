/**
 * M14 - Dashboard Customizer Component
 * Allow users to customize dashboard layout and widgets
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Switch } from '@/core/components/ui/switch';
import { useCreateDashboard, useUpdateDashboard } from '@/modules/dashboards/hooks';
import { WidgetLibrary } from './WidgetLibrary';
import { Layout, Palette, Grid3x3 } from 'lucide-react';

interface DashboardCustomizerProps {
  open: boolean;
  onClose: () => void;
  dashboardId?: string;
}

export function DashboardCustomizer({ open, onClose, dashboardId }: DashboardCustomizerProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  const createDashboard = useCreateDashboard();
  const updateDashboard = useUpdateDashboard();

  const handleSave = async () => {
    if (dashboardId) {
      await updateDashboard.mutateAsync({
        id: dashboardId,
        updates: {
          name_ar: name,
          description_ar: description,
          is_shared: isShared,
          widgets: selectedWidgets.map(id => ({ id })),
        },
      });
    } else {
      await createDashboard.mutateAsync({
        name_ar: name,
        description_ar: description,
        is_shared: isShared,
        widgets: selectedWidgets.map(id => ({ id })),
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dashboardId 
              ? t('dashboard.edit', 'تعديل لوحة التحكم')
              : t('dashboard.create', 'إنشاء لوحة تحكم جديدة')
            }
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.customizer.description', 'خصص لوحة التحكم الخاصة بك بإضافة الأدوات وترتيب التخطيط')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              <Layout className="h-4 w-4 me-2" />
              {t('dashboard.tabs.basic', 'الأساسيات')}
            </TabsTrigger>
            <TabsTrigger value="widgets">
              <Grid3x3 className="h-4 w-4 me-2" />
              {t('dashboard.tabs.widgets', 'الأدوات')}
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Palette className="h-4 w-4 me-2" />
              {t('dashboard.tabs.layout', 'التخطيط')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('dashboard.name', 'اسم لوحة التحكم')}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('dashboard.name.placeholder', 'أدخل اسم لوحة التحكم')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t('dashboard.description', 'الوصف')}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('dashboard.description.placeholder', 'أدخل وصف لوحة التحكم')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shared">
                  {t('dashboard.share', 'مشاركة لوحة التحكم')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.share.description', 'السماح للآخرين بمشاهدة هذه اللوحة')}
                </p>
              </div>
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={setIsShared}
              />
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="mt-4">
            <WidgetLibrary
              selectedWidgets={selectedWidgets}
              onSelectionChange={setSelectedWidgets}
            />
          </TabsContent>

          <TabsContent value="layout" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('dashboard.layout.coming_soon', 'خيارات التخطيط قريباً')}</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'إلغاء')}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name || createDashboard.isPending || updateDashboard.isPending}
          >
            {t('common.save', 'حفظ')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
