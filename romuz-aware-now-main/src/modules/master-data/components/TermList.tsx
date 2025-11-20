/**
 * TermList Component
 * Gate-M: Reusable term list with CRUD operations
 */

import { useMemo, useState } from 'react';
import { useTerms, useCreateTerm, useUpdateTerm, useDeleteTerm, useReorderTerms, useBulkSetTermsActive, useImportTermsCSV, useExportTerms } from '../hooks';
import type { TermFilters, TermInsert, TermUpdate, Pagination } from '../types';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Badge } from '@/core/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function TermList({ catalogId }: { catalogId: string }) {
  const [filters, setFilters] = useState<TermFilters>({ catalogId, orderBy: 'sort_order', orderDir: 'asc' });
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<'all'|'true'|'false'>('all');

  const effectiveFilters = useMemo(()=>({
    ...filters,
    search: search || undefined,
    active: active==='all' ? undefined : active==='true',
  }), [filters, search, active]);

  const { data, isLoading, isError } = useTerms(effectiveFilters);
  const createMutation = useCreateTerm();
  const updateMutation = useUpdateTerm();
  const deleteMutation = useDeleteTerm();
  const reorderMutation = useReorderTerms();
  const bulkActiveMutation = useBulkSetTermsActive();
  const importMutation = useImportTermsCSV();
  const exportMutation = useExportTerms();

  const items = data ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any|null>(null);

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: TermInsert = {
      catalogId: catalogId,
      parentId: String(fd.get('parent_id')||'') || null,
      code: String(fd.get('code')||'').trim(),
      labelAr: String(fd.get('label_ar')||'').trim(),
      labelEn: String(fd.get('label_en')||'').trim(),
      sortOrder: Number(fd.get('sort_order')||0),
      active: (fd.get('active')==='on'),
      attrs: {},
    };

    if (editing) {
      const changes: TermUpdate = { ...payload };
      await updateMutation.mutateAsync({ id: editing.id, changes });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
    setEditing(null);
  }

  async function handleReorder(up: boolean) {
    if (selected.length===0) return;
    const currentOrder = items.map(i=>i.id);
    const sel = selected.filter(id=>currentOrder.includes(id));
    const others = currentOrder.filter(id=>!sel.includes(id));
    const newOrder = up ? [...sel, ...others] : [...others, ...sel];
    await reorderMutation.mutateAsync(newOrder);
    setSelected([]);
  }

  async function handleBulkActive(state: boolean) {
    if (selected.length===0) return;
    await bulkActiveMutation.mutateAsync({ termIds: selected, active: state });
    setSelected([]);
  }

  async function handleImportExample() {
    const rows = [
      { code: 'AWARE_TAGS', label_ar: 'وسم', label_en: 'Tag', parent_code: null, sort_order: 0, active: true, attrs: {} },
    ];
    await importMutation.mutateAsync({ catalogId, rows });
  }

  async function handleExport() {
    await exportMutation.mutateAsync({ catalogId, includeInactive: true });
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
        <div className="flex-1">
          <Label>بحث</Label>
          <Input placeholder="ابحث" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div>
          <Label>الحالة</Label>
          <Select value={active} onValueChange={(v:any)=>setActive(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الكل" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="true">مفعّل</SelectItem>
              <SelectItem value="false">غير مفعّل</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ms-auto flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={()=>{setEditing(null); setOpen(true);}}>+ مصطلح</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing? 'تعديل مصطلح':'إضافة مصطلح'}</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><Label>Code</Label><Input name="code" defaultValue={editing?.code} required /></div>
                  <div><Label>Parent ID</Label><Input name="parent_id" defaultValue={editing?.parentId || ''} placeholder="اختياري" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><Label>Label (AR)</Label><Input name="label_ar" defaultValue={editing?.labelAr} required /></div>
                  <div><Label>Label (EN)</Label><Input name="label_en" defaultValue={editing?.labelEn} required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div><Label>Sort</Label><Input name="sort_order" type="number" defaultValue={editing?.sortOrder ?? 0} /></div>
                  <div className="flex items-end gap-2">
                    <Checkbox id="active" defaultChecked={editing?.active ?? true} name="active" />
                    <Label htmlFor="active">مفعّل</Label>
                  </div>
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
          <Button variant="secondary" onClick={handleImportExample}>استيراد (مثال)</Button>
          <Button variant="outline" onClick={handleExport}>تصدير</Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اختيار</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">تحميل…</TableCell></TableRow>}
            {isError && !isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6 text-destructive">خطأ في الجلب</TableCell></TableRow>}
            {!isLoading && items.map(t=>(
              <TableRow key={t.id}>
                <TableCell><Checkbox checked={selected.includes(t.id)} onCheckedChange={()=>toggleSelect(t.id)} /></TableCell>
                <TableCell className="font-medium">{t.code}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{t.labelAr}</span>
                    <span className="text-muted-foreground text-sm">{t.labelEn}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{t.parentId ?? '-'}</TableCell>
                <TableCell>{t.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={t.active ? 'default' : 'secondary'}>{t.active? 'Active':'Inactive'}</Badge>
                </TableCell>
                <TableCell className="space-x-2 text-left">
                  <Button variant="outline" size="sm" onClick={()=>{ setEditing(t); setOpen(true); }}>تعديل</Button>
                  <Button variant="destructive" size="sm" onClick={()=>deleteMutation.mutate(t.id)}>حذف</Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && items.length===0 && <TableRow><TableCell colSpan={7} className="text-center py-8">لا توجد مصطلحات</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=>handleReorder(true)} disabled={selected.length===0}>تحريك للأعلى</Button>
          <Button variant="outline" size="sm" onClick={()=>handleReorder(false)} disabled={selected.length===0}>تحريك للأسفل</Button>
          <Button variant="secondary" size="sm" onClick={()=>handleBulkActive(true)} disabled={selected.length===0}>تفعيل</Button>
          <Button variant="ghost" size="sm" onClick={()=>handleBulkActive(false)} disabled={selected.length===0}>تعطيل</Button>
        </div>
      </div>
    </div>
  );
}

export default TermList;
