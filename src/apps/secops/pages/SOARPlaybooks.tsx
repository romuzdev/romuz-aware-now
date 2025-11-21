/**
 * SOAR Playbooks Page
 * M18.5 - SOAR Playbooks Management
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { Zap } from 'lucide-react';
import { useSOARPlaybooks } from '@/modules/secops/hooks';
import { SOARPlaybookCard } from '@/modules/secops/components';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useState } from 'react';
import type { SOARPlaybookFilters } from '@/modules/secops/types';

export default function SOARPlaybooks() {
  const [filters, setFilters] = useState<SOARPlaybookFilters>({});
  const {
    playbooks,
    loading,
    activatePlaybook,
    deactivatePlaybook,
    deletePlaybook,
  } = useSOARPlaybooks(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Zap}
        title="أدلة SOAR"
        description="إدارة أدلة الاستجابة الآلية للأحداث الأمنية"
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="البحث في الأدلة..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          
          <Select
            value={filters.is_active?.toString() || 'all'}
            onValueChange={(value) => 
              setFilters({ 
                ...filters, 
                is_active: value === 'all' ? undefined : value === 'true' 
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="true">نشط</SelectItem>
              <SelectItem value="false">غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      ) : playbooks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((playbook) => (
            <SOARPlaybookCard
              key={playbook.id}
              playbook={playbook}
              onActivate={activatePlaybook}
              onDeactivate={deactivatePlaybook}
              onDelete={deletePlaybook}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          لا توجد أدلة SOAR متطابقة مع المعايير المحددة
        </Card>
      )}
    </div>
  );
}
