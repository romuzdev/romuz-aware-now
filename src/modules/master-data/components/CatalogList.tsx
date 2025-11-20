/**
 * CatalogList Component
 * Gate-M: Reusable catalog list with CRUD operations
 */

import { useMemo, useState } from 'react';
import { useCatalogs, useCreateCatalog, useUpdateCatalog, useArchiveCatalog, usePublishCatalog, useDeleteCatalog } from '../hooks';
import type { CatalogFilters, CatalogInsert, CatalogUpdate, Pagination } from '../types';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function CatalogList() {
  const [filters, setFilters] = useState<CatalogFilters>({ orderBy: 'created_at', orderDir: 'desc' });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'GLOBAL'|'TENANT'|''>('');
  const [status, setStatus] = useState<'DRAFT'|'PUBLISHED'|'ARCHIVED'|''>('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);

  const effectiveFilters = useMemo(() => ({
    ...filters,
    scope: scope || undefined,
    status: status || undefined,
    search: search || undefined,
  }), [filters, scope, status, search]);

  const { data, isLoading, isError } = useCatalogs(effectiveFilters);
  const createMutation = useCreateCatalog();
  const updateMutation = useUpdateCatalog();
  const publishMutation = usePublishCatalog();
  const archiveMutation = useArchiveCatalog();
  const deleteMutation = useDeleteCatalog();

  function resetForm() {
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: CatalogInsert = {
      code: String(fd.get('code') || '').trim(),
      labelAr: String(fd.get('label_ar') || '').trim(),
      labelEn: String(fd.get('label_en') || '').trim(),
      scope: (fd.get('scope') as 'GLOBAL'|'TENANT') || 'TENANT',
      status: (fd.get('status') as 'DRAFT'|'PUBLISHED'|'ARCHIVED') || 'DRAFT',
      tenantId: (fd.get('scope') === 'TENANT') ? (String(fd.get('tenant_id') || '') || null) : null,
      meta: {},
    };

    if (editingId) {
      const changes: CatalogUpdate = { ...payload };
      await updateMutation.mutateAsync({ id: editingId, changes });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
    resetForm();
  }

  const items = data ?? [];

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
        <div className="flex-1">
          <Label>بحث</Label>
          <Input placeholder="ابحث بالكود أو العربية/الإنجليزية" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div>
          <Label>النطاق</Label>
          <Select value={scope} onValueChange={(v:any)=>setScope(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الكل" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              <SelectItem value="GLOBAL">GLOBAL</SelectItem>
              <SelectItem value="TENANT">TENANT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>الحالة</Label>
          <Select value={status} onValueChange={(v:any)=>setStatus(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الكل" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              <SelectItem value="DRAFT">DRAFT</SelectItem>
              <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
              <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ms-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={()=>{resetForm(); setOpen(true);}}>+ كتالوج جديد</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId? 'تعديل كتالوج':'كتالوج جديد'}</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div>
                  <Label>Code</Label>
                  <Input name="code" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label>Label (AR)</Label>
                    <Input name="label_ar" required />
                  </div>
                  <div>
                    <Label>Label (EN)</Label>
                    <Input name="label_en" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label>Scope</Label>
                    <Select name="scope" defaultValue="TENANT">
                      <SelectTrigger><SelectValue placeholder="TENANT" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TENANT">TENANT</SelectItem>
                        <SelectItem value="GLOBAL">GLOBAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select name="status" defaultValue="DRAFT">
                      <SelectTrigger><SelectValue placeholder="DRAFT" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                        <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tenant ID (إن وُجد)</Label>
                  <Input name="tenant_id" placeholder="اتركه فارغًا لـ GLOBAL" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    حفظ
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-6">تحميل…</TableCell></TableRow>
            )}
            {isError && !isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-destructive">حدث خطأ أثناء الجلب</TableCell></TableRow>
            )}
            {!isLoading && items.map((c)=>(
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.code}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{c.labelAr}</span>
                    <span className="text-muted-foreground text-sm">{c.labelEn}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{c.scope}</Badge></TableCell>
                <TableCell>
                  <Badge variant={c.status==='PUBLISHED' ? 'default' : c.status==='ARCHIVED' ? 'secondary' : 'outline'}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell>{c.version}</TableCell>
                <TableCell className="space-x-2 text-left">
                  <Button variant="outline" size="sm" onClick={()=>{ setEditingId(c.id); setOpen(true); }}>تعديل</Button>
                  <Button variant="secondary" size="sm" onClick={()=>publishMutation.mutate(c.id)}>نشر</Button>
                  <Button variant="ghost" size="sm" onClick={()=>archiveMutation.mutate(c.id)}>أرشفة</Button>
                  <Button variant="destructive" size="sm" onClick={()=>deleteMutation.mutate(c.id)}>حذف</Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && items.length===0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد كتالوجات</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default CatalogList;
