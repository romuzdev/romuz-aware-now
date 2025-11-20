/**
 * Event Filters Component
 * 
 * مكون التصفية المتقدمة للأحداث
 */

import { Filter, X } from 'lucide-react';
import type { EventFilterCriteria } from '@/lib/events/utils/eventFilters';

interface EventFiltersProps {
  filters: EventFilterCriteria;
  onFiltersChange: (filters: EventFilterCriteria) => void;
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof EventFilterCriteria]);

  return (
    <div className="bg-card border rounded-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-semibold">التصفية</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              مسح
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الفئة</label>
          <select
            value={filters.category || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, category: e.target.value as any || undefined })
            }
            className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">جميع الفئات</option>
            <option value="policy">السياسات</option>
            <option value="action">الإجراءات</option>
            <option value="kpi">المؤشرات</option>
            <option value="campaign">الحملات</option>
            <option value="training">التدريب</option>
            <option value="alert">التنبيهات</option>
            <option value="system">النظام</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الأولوية</label>
          <select
            value={filters.priority || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, priority: e.target.value as any || undefined })
            }
            className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">جميع الأولويات</option>
            <option value="critical">حرجة</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الحالة</label>
          <select
            value={filters.status || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value as any || undefined })
            }
            className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">قيد المعالجة</option>
            <option value="completed">مكتمل</option>
            <option value="failed">فشل</option>
          </select>
        </div>

        {/* Source Module Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">المصدر</label>
          <select
            value={filters.sourceModule || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, sourceModule: e.target.value || undefined })
            }
            className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">جميع المصادر</option>
            <option value="gate_f">Gate-F (السياسات)</option>
            <option value="gate_h">Gate-H (الإجراءات)</option>
            <option value="gate_i">Gate-I (المؤشرات)</option>
            <option value="gate_k">Gate-K (الحملات)</option>
            <option value="gate_l">Gate-L (التحليلات)</option>
            <option value="lms">نظام التدريب</option>
            <option value="awareness">قياس الأثر</option>
            <option value="phishing">محاكاة التصيد</option>
          </select>
        </div>
      </div>
    </div>
  );
}
