/**
 * TermSelector Component
 * Gate-M: Hierarchical term selection component
 */

import { useTerms } from '../hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Loader2 } from 'lucide-react';

interface TermSelectorProps {
  catalogId: string;
  value?: string;
  onValueChange: (value: string) => void;
  parentId?: string | null;
  placeholder?: string;
  disabled?: boolean;
  activeOnly?: boolean;
}

export function TermSelector({
  catalogId,
  value,
  onValueChange,
  parentId,
  placeholder = 'اختر المصطلح',
  disabled = false,
  activeOnly = true,
}: TermSelectorProps) {
  const { data, isLoading } = useTerms({
    catalogId,
    parentId,
    active: activeOnly ? true : undefined,
  });

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
        {data?.map((term) => (
          <SelectItem key={term.id} value={term.id}>
            {term.labelAr} ({term.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
