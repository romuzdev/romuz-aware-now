/**
 * Security Events Page
 * M18.5 - Security Events Management
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { AlertTriangle } from 'lucide-react';
import { useSecurityEvents } from '@/modules/secops/hooks';
import { SecurityEventCard } from '@/modules/secops/components';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useState } from 'react';
import type { SecurityEventFilters, EventSeverity } from '@/modules/secops/types';

export default function SecurityEventsPage() {
  const [filters, setFilters] = useState<SecurityEventFilters>({});
  const { events, loading, markAsProcessed } = useSecurityEvents(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={AlertTriangle}
        title="الأحداث الأمنية"
        description="عرض ومراقبة جميع الأحداث الأمنية"
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            placeholder="البحث في الأحداث..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          
          <Select
            value={Array.isArray(filters.severity) ? 'all' : filters.severity || 'all'}
            onValueChange={(value) => 
              setFilters({ ...filters, severity: value === 'all' ? undefined : [value] as EventSeverity[] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="مستوى الخطورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="critical">حرج</SelectItem>
              <SelectItem value="high">عالي</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="low">منخفض</SelectItem>
              <SelectItem value="info">معلوماتي</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.is_processed?.toString() || 'all'}
            onValueChange={(value) => 
              setFilters({ 
                ...filters, 
                is_processed: value === 'all' ? undefined : value === 'true' 
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="false">غير معالج</SelectItem>
              <SelectItem value="true">معالج</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <SecurityEventCard
              key={event.id}
              event={event}
              onProcess={(id) => markAsProcessed({ id })}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          لا توجد أحداث أمنية متطابقة مع المعايير المحددة
        </Card>
      )}
    </div>
  );
}
