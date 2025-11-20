/**
 * Filter Bar Component
 * Reusable filter bar with search and filters
 */

import { ReactNode } from 'react';
import { SearchInput } from './search-input';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  searchValue?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center', className)}>
      <SearchInput
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
        className="flex-1"
      />
      {filters && <div className="flex items-center gap-2">{filters}</div>}
      {actions && <div className="flex items-center gap-2 sm:mr-auto">{actions}</div>}
    </div>
  );
}
