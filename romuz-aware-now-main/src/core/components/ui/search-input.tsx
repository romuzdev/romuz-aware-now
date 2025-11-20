/**
 * Search Input Component
 * Enhanced search input with clear button
 */

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = 'بحث...',
  value: controlledValue,
  onChange,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pr-10 pl-10"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
