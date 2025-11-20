import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Search } from 'lucide-react';
import type { CourseFilters as Filters } from '../../types';

interface CourseFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function CourseFilters({ filters, onFiltersChange }: CourseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن دورة..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pr-10"
        />
      </div>
      
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            status: value === 'all' ? undefined : value as any 
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الحالات</SelectItem>
          <SelectItem value="draft">مسودة</SelectItem>
          <SelectItem value="published">منشور</SelectItem>
          <SelectItem value="archived">مؤرشف</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.level || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            level: value === 'all' ? undefined : value as any 
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="المستوى" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع المستويات</SelectItem>
          <SelectItem value="beginner">مبتدئ</SelectItem>
          <SelectItem value="intermediate">متوسط</SelectItem>
          <SelectItem value="advanced">متقدم</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
