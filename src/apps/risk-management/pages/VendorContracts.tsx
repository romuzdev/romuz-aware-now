/**
 * Vendor Contracts Page
 * Manage vendor contracts and agreements
 */

import { useState } from 'react';
import { Plus, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { useVendorContracts } from '@/modules/grc/hooks/useThirdPartyRisk';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function VendorContracts() {
  const navigate = useNavigate();
  const { data: contracts, isLoading } = useVendorContracts();
  const [filter, setFilter] = useState<string>('all');

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const filteredContracts = contracts?.filter((contract) => {
    if (filter === 'all') return true;
    if (filter === 'active') return contract.status === 'active';
    if (filter === 'expiring') {
      if (!contract.expiry_date) return false;
      const expiryDate = new Date(contract.expiry_date);
      return contract.status === 'active' && expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    }
    if (filter === 'expired') {
      if (!contract.expiry_date) return false;
      const expiryDate = new Date(contract.expiry_date);
      return expiryDate < now;
    }
    return true;
  });

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'terminated':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const date = new Date(expiryDate);
    return date <= thirtyDaysFromNow && date >= now;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < now;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
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
          <h1 className="text-3xl font-bold">عقود الموردين</h1>
          <p className="text-muted-foreground mt-1">
            إدارة ومتابعة عقود الموردين والأطراف الثالثة
          </p>
        </div>
        <Button onClick={() => navigate('/risk/contracts/new')}>
          <Plus className="h-4 w-4 ml-2" />
          عقد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي العقود</p>
              <p className="text-2xl font-bold">{contracts?.length || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عقود نشطة</p>
              <p className="text-2xl font-bold">
                {contracts?.filter((c) => c.status === 'active').length || 0}
              </p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ستنتهي قريباً</p>
              <p className="text-2xl font-bold text-orange-500">
                {contracts?.filter((c) => c.status === 'active' && isExpiringSoon(c.expiry_date)).length || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عقود منتهية</p>
              <p className="text-2xl font-bold text-destructive">
                {contracts?.filter((c) => isExpired(c.expiry_date)).length || 0}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-destructive" />
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
          نشط
        </Button>
        <Button
          variant={filter === 'expiring' ? 'default' : 'outline'}
          onClick={() => setFilter('expiring')}
          size="sm"
        >
          ستنتهي قريباً
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          onClick={() => setFilter('expired')}
          size="sm"
        >
          منتهي
        </Button>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts?.map((contract) => (
          <Card
            key={contract.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/risk/contracts/${contract.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {contract.contract_title_ar}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    رقم العقد: {contract.contract_code}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusBadgeVariant(contract.status)}>
                    {contract.status === 'active' ? 'نشط' :
                     contract.status === 'expired' ? 'منتهي' :
                     contract.status === 'terminated' ? 'ملغي' :
                     contract.status === 'draft' ? 'مسودة' : contract.status}
                  </Badge>
                  {isExpiringSoon(contract.expiry_date) && contract.status === 'active' && (
                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                      سينتهي قريباً
                    </Badge>
                  )}
                  {isExpired(contract.expiry_date) && (
                    <Badge variant="destructive">
                      منتهي
                    </Badge>
                  )}
                </div>

                {contract.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {contract.notes}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ السريان</p>
                    <p className="text-sm font-medium">
                      {new Date(contract.effective_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  {contract.expiry_date && (
                    <div>
                      <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
                      <p className={`text-sm font-medium ${
                        isExpired(contract.expiry_date) ? 'text-destructive' :
                        isExpiringSoon(contract.expiry_date) ? 'text-orange-500' : ''
                      }`}>
                        {new Date(contract.expiry_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  )}
                  {contract.contract_value && (
                    <div>
                      <p className="text-xs text-muted-foreground">قيمة العقد</p>
                      <p className="text-sm font-medium">
                        {contract.contract_value.toLocaleString('ar-SA')} {contract.currency || 'SAR'}
                      </p>
                    </div>
                  )}
                  {contract.payment_terms && (
                    <div>
                      <p className="text-xs text-muted-foreground">شروط الدفع</p>
                      <p className="text-sm font-medium">{contract.payment_terms}</p>
                    </div>
                  )}
                </div>
              </div>

              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {filteredContracts?.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد عقود</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بإضافة عقد جديد لإدارة العلاقات مع الموردين
          </p>
          <Button onClick={() => navigate('/risk/contracts/new')}>
            <Plus className="h-4 w-4 ml-2" />
            عقد جديد
          </Button>
        </Card>
      )}
    </div>
  );
}
