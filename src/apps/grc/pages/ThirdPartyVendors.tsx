/**
 * Third-Party Vendors Page
 * Vendor registry and management
 */

import { useState } from 'react';
import { Plus, Building2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVendors } from '@/modules/grc/hooks/useThirdPartyRisk';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function ThirdPartyVendors() {
  const navigate = useNavigate();
  const { data: vendors, isLoading } = useVendors();
  const [filter, setFilter] = useState<string>('all');

  const filteredVendors = vendors?.filter((vendor) => {
    if (filter === 'all') return true;
    if (filter === 'active') return vendor.status === 'active';
    if (filter === 'inactive') return vendor.status === 'inactive';
    if (filter === 'high-risk') return vendor.risk_level === 'high' || vendor.risk_level === 'critical';
    return true;
  });

  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الموردون والأطراف الثالثة</h1>
          <p className="text-muted-foreground mt-1">
            إدارة الموردين وتقييم مخاطرهم
          </p>
        </div>
        <Button onClick={() => navigate('/grc/vendors/new')}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مورد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الموردين</p>
              <p className="text-2xl font-bold">{vendors?.length || 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">الموردون النشطون</p>
              <p className="text-2xl font-bold">
                {vendors?.filter((v) => v.status === 'active').length || 0}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مخاطر عالية</p>
              <p className="text-2xl font-bold text-destructive">
                {vendors?.filter((v) => v.risk_level === 'high' || v.risk_level === 'critical')
                  .length || 0}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عقود منتهية</p>
              <p className="text-2xl font-bold">
                {vendors?.filter((v) => v.contract_end_date && new Date(v.contract_end_date) < new Date())
                  .length || 0}
              </p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          الكل
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          size="sm"
        >
          النشط
        </Button>
        <Button
          variant={filter === 'inactive' ? 'default' : 'outline'}
          onClick={() => setFilter('inactive')}
          size="sm"
        >
          غير نشط
        </Button>
        <Button
          variant={filter === 'high-risk' ? 'default' : 'outline'}
          onClick={() => setFilter('high-risk')}
          size="sm"
        >
          مخاطر عالية
        </Button>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors?.map((vendor) => (
          <Card
            key={vendor.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/grc/vendors/${vendor.id}`)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{vendor.name}</h3>
                  {vendor.website && (
                    <p className="text-sm text-muted-foreground">{vendor.website}</p>
                  )}
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={getStatusBadgeVariant(vendor.status)}>
                  {vendor.status === 'active' ? 'نشط' : vendor.status === 'inactive' ? 'غير نشط' : 'معلق'}
                </Badge>
                {vendor.risk_level && (
                  <Badge variant={getRiskBadgeVariant(vendor.risk_level)}>
                    {vendor.risk_level === 'critical' ? 'حرجة' :
                     vendor.risk_level === 'high' ? 'عالية' :
                     vendor.risk_level === 'medium' ? 'متوسطة' :
                     vendor.risk_level === 'low' ? 'منخفضة' : 'غير محددة'}
                  </Badge>
                )}
              </div>

              {vendor.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {vendor.description}
                </p>
              )}

              <div className="pt-4 border-t space-y-1 text-sm">
                {vendor.contact_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">جهة الاتصال:</span>
                    <span>{vendor.contact_name}</span>
                  </div>
                )}
                {vendor.service_category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفئة:</span>
                    <span>{vendor.service_category}</span>
                  </div>
                )}
                {vendor.contract_end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">انتهاء العقد:</span>
                    <span className={
                      new Date(vendor.contract_end_date) < new Date()
                        ? 'text-destructive'
                        : ''
                    }>
                      {new Date(vendor.contract_end_date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredVendors?.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد موردين</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بإضافة مورد جديد لإدارة مخاطر الطرف الثالث
          </p>
          <Button onClick={() => navigate('/grc/vendors/new')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مورد
          </Button>
        </Card>
      )}
    </div>
  );
}
