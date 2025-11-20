/**
 * Integration Marketplace Component
 * Gate-M15: Connector catalog and installation interface
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Search, Check, Clock, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useQuery } from '@tanstack/react-query';
import { fetchConnectors } from '../integration/connectors.integration';

interface ConnectorCatalogItem {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  category: string;
  installed: boolean;
  status?: string;
}

const CONNECTOR_CATALOG: Omit<ConnectorCatalogItem, 'installed' | 'status'>[] = [
  {
    id: 'slack',
    name: 'Slack',
    type: 'slack',
    description: 'إرسال الإشعارات والتنبيهات إلى قنوات Slack',
    icon: '💬',
    category: 'communication',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    type: 'teams',
    description: 'التكامل مع Microsoft Teams للإشعارات والتنبيهات',
    icon: '👥',
    category: 'communication',
  },
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    type: 'google_workspace',
    description: 'مزامنة الملفات والمستخدمين من Google Drive',
    icon: '📁',
    category: 'storage',
  },
  {
    id: 'odoo',
    name: 'Odoo ERP',
    type: 'odoo',
    description: 'مزامنة بيانات الموظفين والأقسام من Odoo',
    icon: '🏢',
    category: 'erp',
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    type: 'webhook',
    description: 'استقبال الأحداث من الأنظمة الخارجية',
    icon: '🔗',
    category: 'integration',
  },
  {
    id: 'api',
    name: 'REST API',
    type: 'api',
    description: 'التكامل مع أي نظام عبر REST API',
    icon: '🔌',
    category: 'integration',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '📦' },
  { id: 'communication', name: 'التواصل', icon: '💬' },
  { id: 'storage', name: 'التخزين', icon: '📁' },
  { id: 'erp', name: 'ERP', icon: '🏢' },
  { id: 'integration', name: 'التكامل', icon: '🔗' },
];

interface IntegrationMarketplaceProps {
  onInstall: (connectorType: string) => void;
  onConfigure: (connectorId: string) => void;
}

export function IntegrationMarketplace({ onInstall, onConfigure }: IntegrationMarketplaceProps) {
  const { tenantId } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch installed connectors
  const { data: installedConnectors = [] } = useQuery({
    queryKey: ['connectors', tenantId],
    queryFn: () => fetchConnectors(tenantId!),
    enabled: !!tenantId,
  });

  // Merge catalog with installed status
  const connectors: ConnectorCatalogItem[] = CONNECTOR_CATALOG.map(item => {
    const installed = installedConnectors.find(c => c.type === item.type);
    return {
      ...item,
      installed: !!installed,
      status: installed?.status,
    };
  });

  // Filter connectors
  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         connector.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (connector: ConnectorCatalogItem) => {
    if (!connector.installed) {
      return <Badge variant="outline">غير مثبت</Badge>;
    }
    if (connector.status === 'active') {
      return <Badge variant="default" className="bg-success"><Check className="w-3 h-3 mr-1" />نشط</Badge>;
    }
    if (connector.status === 'inactive') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />متوقف</Badge>;
    }
    if (connector.status === 'error') {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />خطأ</Badge>;
    }
    return <Badge variant="outline">مثبت</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">متجر التكاملات</h2>
        <p className="text-muted-foreground">استعرض وقم بتثبيت التكاملات مع الأنظمة الخارجية</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="البحث عن تكامل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            <span className="ml-2">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnectors.map(connector => (
          <Card key={connector.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{connector.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{connector.name}</CardTitle>
                    {getStatusBadge(connector)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 min-h-[3rem]">
                {connector.description}
              </CardDescription>
              <div className="flex gap-2">
                {!connector.installed ? (
                  <Button
                    onClick={() => onInstall(connector.type)}
                    className="w-full"
                  >
                    تثبيت
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        const installed = installedConnectors.find(c => c.type === connector.type);
                        if (installed) onConfigure(installed.id);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      تكوين
                    </Button>
                    {connector.status === 'inactive' && (
                      <Button
                        onClick={() => {
                          const installed = installedConnectors.find(c => c.type === connector.type);
                          if (installed) onConfigure(installed.id);
                        }}
                        className="w-full"
                      >
                        تفعيل
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConnectors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لم يتم العثور على تكاملات مطابقة</p>
        </div>
      )}
    </div>
  );
}
