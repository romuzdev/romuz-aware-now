/**
 * CatalogSelector Component
 * Gate-M: Reusable catalog selection component
 */

import { useCatalogs } from '../hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CatalogSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  scope?: 'GLOBAL' | 'TENANT';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  placeholder?: string;
  disabled?: boolean;
}

export function CatalogSelector({
  value,
  onValueChange,
  scope,
  status = undefined,
  placeholder = 'اختر الكتالوج',
  disabled = false,
}: CatalogSelectorProps) {
  const { data, isLoading } = useCatalogs({ scope, status });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري التحميل...
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {data?.map((catalog) => (
          <SelectItem key={catalog.id} value={catalog.id}>
            {catalog.labelAr} ({catalog.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
