/**
 * SecOps Connectors Page
 * M18.5 - Security Connectors Management
 */

import { PageHeader } from '@/core/components/ui/page-header';
import { Cable } from 'lucide-react';
import { useSecOpsConnectors } from '@/modules/secops/hooks';
import { ConnectorCard } from '@/modules/secops/components';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { useState } from 'react';
import type { ConnectorFilters, ConnectorType } from '@/modules/secops/types';

export default function Connectors() {
  const [filters, setFilters] = useState<ConnectorFilters>({});
  const {
    connectors,
    loading,
    deleteConnector,
  } = useSecOpsConnectors(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Cable}
        title="موصلات SecOps"
        description="إدارة الاتصال بأنظمة الأمن الخارجية"
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="البحث في الموصلات..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          
          <Select
            value={Array.isArray(filters.connector_type) ? 'all' : filters.connector_type || 'all'}
            onValueChange={(value) => 
              setFilters({ 
                ...filters, 
                connector_type: value === 'all' ? undefined : [value] as ConnectorType[]
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="نوع الموصل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="siem">SIEM</SelectItem>
              <SelectItem value="firewall">جدار الحماية</SelectItem>
              <SelectItem value="ids_ips">IDS/IPS</SelectItem>
              <SelectItem value="endpoint_protection">حماية النقاط الطرفية</SelectItem>
              <SelectItem value="email_security">أمان البريد</SelectItem>
              <SelectItem value="dlp">DLP</SelectItem>
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
              <div className="h-16 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      ) : connectors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              onDelete={deleteConnector}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          لا توجد موصلات متطابقة مع المعايير المحددة
        </Card>
      )}
    </div>
  );
}
