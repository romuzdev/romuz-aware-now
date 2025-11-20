/**
 * MappingsPage - Gate-M Mappings Management
 * Platform Admin Page for External System Mappings
 */

import { useState } from 'react';
import { Upload, Download, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { FilterBar } from '@/core/components/ui/filter-bar';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { useMappings, useCreateMapping, useDeleteMapping } from '@/modules/master-data/hooks';
import { CatalogSelector, TermSelector } from '@/modules/master-data/components';
import { BulkImportDialog } from '@/modules/master-data/components/BulkImportDialog';
import type { CreateMappingInput } from '@/modules/master-data/types';

export default function MappingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [selectedSourceSystem, setSelectedSourceSystem] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: mappings = [], isLoading } = useMappings({
    catalogId: selectedCatalog || undefined,
    sourceSystem: selectedSourceSystem || undefined,
    search: searchTerm || undefined,
  });

  const createMutation = useCreateMapping();
  const deleteMutation = useDeleteMapping();

  const [newMapping, setNewMapping] = useState<Partial<CreateMappingInput>>({
    catalogId: '',
    termId: null,
    sourceSystem: '',
    srcCode: '',
    targetCode: '',
    notes: '',
  });

  const handleCreate = async () => {
    if (!newMapping.catalogId || !newMapping.sourceSystem || !newMapping.srcCode || !newMapping.targetCode) {
      return;
    }

    await createMutation.mutateAsync({
      catalogId: newMapping.catalogId,
      termId: newMapping.termId,
      sourceSystem: newMapping.sourceSystem,
      srcCode: newMapping.srcCode,
      targetCode: newMapping.targetCode,
      notes: newMapping.notes,
    });

    setCreateDialogOpen(false);
    setNewMapping({
      catalogId: '',
      termId: null,
      sourceSystem: '',
      srcCode: '',
      targetCode: '',
      notes: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذا الربط؟')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Catalog ID', 'Term ID', 'Source System', 'Source Code', 'Target Code', 'Notes'].join(','),
      ...mappings.map(m =>
        [m.catalogId, m.termId || '', m.sourceSystem, m.srcCode, m.targetCode, m.notes || ''].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mappings_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="الربط الخارجي (Mappings)"
        description="إدارة ربط الأنظمة الخارجية مع المصطلحات"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 ml-2" />
              استيراد
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              ربط جديد
            </Button>
          </div>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="بحث في الأكواد أو الملاحظات..."
        filters={
          <>
            <CatalogSelector
              value={selectedCatalog}
              onValueChange={setSelectedCatalog}
              placeholder="جميع الكتالوجات"
            />
            <Input
              placeholder="نظام المصدر"
              value={selectedSourceSystem}
              onChange={(e) => setSelectedSourceSystem(e.target.value)}
              className="w-48"
            />
          </>
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نظام المصدر</TableHead>
              <TableHead>كود المصدر</TableHead>
              <TableHead>كود الهدف</TableHead>
              <TableHead>المصطلح</TableHead>
              <TableHead>الملاحظات</TableHead>
              <TableHead className="w-20">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  لا توجد بيانات
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.sourceSystem}</TableCell>
                  <TableCell>{mapping.srcCode}</TableCell>
                  <TableCell>{mapping.targetCode}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {mapping.termId || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{mapping.notes || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ربط جديد</DialogTitle>
            <DialogDescription>أضف ربط بين نظام خارجي والمصطلحات</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>الكتالوج *</Label>
              <CatalogSelector
                value={newMapping.catalogId || ''}
                onValueChange={(val) => setNewMapping({ ...newMapping, catalogId: val })}
              />
            </div>

            <div className="grid gap-2">
              <Label>المصطلح (اختياري)</Label>
              <TermSelector
                catalogId={newMapping.catalogId || ''}
                value={newMapping.termId || ''}
                onValueChange={(val) => setNewMapping({ ...newMapping, termId: val || null })}
                disabled={!newMapping.catalogId}
              />
            </div>

            <div className="grid gap-2">
              <Label>نظام المصدر *</Label>
              <Input
                value={newMapping.sourceSystem || ''}
                onChange={(e) => setNewMapping({ ...newMapping, sourceSystem: e.target.value })}
                placeholder="مثال: SAP, Oracle"
              />
            </div>

            <div className="grid gap-2">
              <Label>كود المصدر *</Label>
              <Input
                value={newMapping.srcCode || ''}
                onChange={(e) => setNewMapping({ ...newMapping, srcCode: e.target.value })}
                placeholder="الكود في النظام الخارجي"
              />
            </div>

            <div className="grid gap-2">
              <Label>كود الهدف *</Label>
              <Input
                value={newMapping.targetCode || ''}
                onChange={(e) => setNewMapping({ ...newMapping, targetCode: e.target.value })}
                placeholder="الكود المستهدف في النظام"
              />
            </div>

            <div className="grid gap-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={newMapping.notes || ''}
                onChange={(e) => setNewMapping({ ...newMapping, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !newMapping.catalogId ||
                !newMapping.sourceSystem ||
                !newMapping.srcCode ||
                !newMapping.targetCode
              }
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityType="mappings"
        catalogId={selectedCatalog}
      />
    </div>
  );
}
