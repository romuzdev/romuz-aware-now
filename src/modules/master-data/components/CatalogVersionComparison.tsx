/**
 * CatalogVersionComparison - Version Comparison UI
 * Gate-M: Side-by-side catalog version comparison with diff highlighting
 */

import { useState, useMemo } from 'react';
import { ArrowRight, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { RefCatalog } from '@/modules/master-data/types';

interface CatalogVersionComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogs: RefCatalog[];
  onRestore?: (catalogId: string, version: number) => void;
}

type DiffType = 'unchanged' | 'added' | 'removed' | 'modified';

interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
  type: DiffType;
}

function compareVersions(v1: RefCatalog | null, v2: RefCatalog | null): FieldDiff[] {
  if (!v1 && !v2) return [];
  if (!v1)
    return [
      { field: 'catalog', oldValue: null, newValue: v2?.code, type: 'added' },
    ];
  if (!v2)
    return [
      { field: 'catalog', oldValue: v1?.code, newValue: null, type: 'removed' },
    ];

  const diffs: FieldDiff[] = [];

  const compareField = (field: keyof RefCatalog, label: string) => {
    const old = v1[field];
    const current = v2[field];
    if (JSON.stringify(old) !== JSON.stringify(current)) {
      diffs.push({ field: label, oldValue: old, newValue: current, type: 'modified' });
    } else {
      diffs.push({ field: label, oldValue: old, newValue: current, type: 'unchanged' });
    }
  };

  compareField('code', 'الكود');
  compareField('labelAr', 'الاسم بالعربية');
  compareField('labelEn', 'الاسم بالإنجليزية');
  compareField('scope', 'النطاق');
  compareField('status', 'الحالة');
  compareField('version', 'الإصدار');
  compareField('meta', 'البيانات الوصفية');

  return diffs;
}

function DiffRow({ diff }: { diff: FieldDiff }) {
  const getDiffIcon = () => {
    switch (diff.type) {
      case 'added':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[200px,1fr,auto,1fr] gap-4 p-3 rounded-md',
        diff.type === 'modified' && 'bg-amber-50 dark:bg-amber-950/20',
        diff.type === 'added' && 'bg-green-50 dark:bg-green-950/20',
        diff.type === 'removed' && 'bg-red-50 dark:bg-red-950/20'
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {getDiffIcon()}
        <span>{diff.field}</span>
      </div>
      <div className="font-mono text-sm text-muted-foreground">
        {formatValue(diff.oldValue)}
      </div>
      {diff.type !== 'unchanged' && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
      {diff.type === 'unchanged' && <div className="h-4 w-4" />}
      <div className="font-mono text-sm">{formatValue(diff.newValue)}</div>
    </div>
  );
}

export function CatalogVersionComparison({
  open,
  onOpenChange,
  catalogs,
  onRestore,
}: CatalogVersionComparisonProps) {
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [compareVersion, setCompareVersion] = useState<number>(1);

  const currentCatalog = catalogs.find(c => c.id === selectedCatalog);
  const versions = useMemo(() => {
    if (!currentCatalog) return [];
    // In real scenario, fetch historical versions from backend
    // For now, generate mock versions
    return Array.from({ length: currentCatalog.version }, (_, i) => i + 1);
  }, [currentCatalog]);

  const comparisonData = useMemo(() => {
    if (!currentCatalog) return [];
    // Mock: In production, fetch the specific version from backend
    const olderVersion = { ...currentCatalog, version: compareVersion };
    return compareVersions(olderVersion, currentCatalog);
  }, [currentCatalog, compareVersion]);

  const stats = useMemo(() => {
    return {
      added: comparisonData.filter(d => d.type === 'added').length,
      removed: comparisonData.filter(d => d.type === 'removed').length,
      modified: comparisonData.filter(d => d.type === 'modified').length,
      unchanged: comparisonData.filter(d => d.type === 'unchanged').length,
    };
  }, [comparisonData]);

  const handleRestore = () => {
    if (onRestore && selectedCatalog) {
      onRestore(selectedCatalog, compareVersion);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>مقارنة الإصدارات</DialogTitle>
          <DialogDescription>قارن بين إصدارات الكتالوج المختلفة</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">الكتالوج</label>
            <Select value={selectedCatalog} onValueChange={setSelectedCatalog}>
              <SelectTrigger>
                <SelectValue placeholder="اختر كتالوج" />
              </SelectTrigger>
              <SelectContent>
                {catalogs.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.labelAr} (v{cat.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">مقارنة مع الإصدار</label>
            <Select
              value={String(compareVersion)}
              onValueChange={v => setCompareVersion(Number(v))}
              disabled={!selectedCatalog}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر إصدار" />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v} value={String(v)}>
                    الإصدار {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {currentCatalog && (
          <>
            {/* Stats */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">إضافات: {stats.added}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">حذف: {stats.removed}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm">تعديلات: {stats.modified}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4" />
                <span className="text-sm">بدون تغيير: {stats.unchanged}</span>
              </div>
            </div>

            {/* Comparison */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {comparisonData.map((diff, idx) => (
                  <DiffRow key={idx} diff={diff} />
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          {onRestore && (
            <Button onClick={handleRestore} disabled={!selectedCatalog}>
              <RefreshCw className="h-4 w-4 ml-2" />
              استعادة الإصدار {compareVersion}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
