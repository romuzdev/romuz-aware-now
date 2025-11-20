/**
 * MappingList Component
 * Gate-M: Reusable mapping list with CRUD operations
 */

import { useState, useMemo } from 'react';
import { useMappings, useUpsertMapping, useDeleteMapping } from '../hooks';
import type { MappingFilters, MappingInsert } from '../types';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Label } from '@/core/components/ui/label';

export function MappingList({ catalogId, termId }: { catalogId: string; termId?: string }) {
  const [filters, setFilters] = useState<MappingFilters>({ catalogId, termId });
  const [srcSystem, setSrcSystem] = useState('');
  const [srcCode, setSrcCode] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any|null>(null);

  const effectiveFilters = useMemo(()=>({
    ...filters,
    sourceSystem: srcSystem || undefined,
    srcCode: srcCode || undefined
  }), [filters, srcSystem, srcCode]);

  const { data, isLoading, isError } = useMappings(effectiveFilters);
  const upsert = useUpsertMapping();
  const remove = useDeleteMapping();

  const items = data ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    
    const termIdValue = String(fd.get('term_id')||'').trim();
    
    await upsert.mutateAsync({
      catalogId: catalogId,
      termId: termIdValue || termId || null,
      sourceSystem: String(fd.get('source_system')||'').trim(),
      srcCode: String(fd.get('src_code')||'').trim(),
      targetCode: String(fd.get('target_code')||'').trim(),
      notes: String(fd.get('notes')||'').trim() || null,
    });
    setOpen(false);
    setEdit(null);
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
        <div className="flex-1">
          <Label>System</Label>
          <Input placeholder="مثال: SAP, Odoo" value={srcSystem} onChange={e=>setSrcSystem(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label>Source Code</Label>
          <Input placeholder="ابحث بالرمز" value={srcCode} onChange={e=>setSrcCode(e.target.value)} />
        </div>
        <div className="ms-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={()=>{ setEdit(null); setOpen(true); }}>+ Mapping</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit? 'تعديل Mapping':'إضافة Mapping'}</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><Label>Term ID (اختياري)</Label><Input name="term_id" defaultValue={termId || ''} placeholder="اتركه فارغًا لربط على مستوى الكتالوج" /></div>
                  <div><Label>Source System</Label><Input name="source_system" required defaultValue={edit?.sourceSystem} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><Label>Source Code</Label><Input name="src_code" required defaultValue={edit?.srcCode} /></div>
                  <div><Label>Target Code</Label><Input name="target_code" required defaultValue={edit?.targetCode} /></div>
                </div>
                <div><Label>Notes</Label><Input name="notes" defaultValue={edit?.notes || ''} /></div>
                <DialogFooter><Button type="submit">حفظ</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System</TableHead>
              <TableHead>Src Code</TableHead>
              <TableHead>Target Code</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6">تحميل…</TableCell></TableRow>}
            {isError && !isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-destructive">خطأ في الجلب</TableCell></TableRow>}
            {!isLoading && items.map(m=>(
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.sourceSystem}</TableCell>
                <TableCell>{m.srcCode}</TableCell>
                <TableCell>{m.targetCode}</TableCell>
                <TableCell className="text-sm">{m.termId ?? '-'}</TableCell>
                <TableCell className="text-sm">{m.notes ?? '-'}</TableCell>
                <TableCell className="space-x-2 text-left">
                  <Button variant="outline" size="sm" onClick={()=>{ setEdit(m); setOpen(true); }}>تعديل</Button>
                  <Button variant="destructive" size="sm" onClick={()=>remove.mutate(m.id)}>حذف</Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && items.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد Mappings</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default MappingList;
