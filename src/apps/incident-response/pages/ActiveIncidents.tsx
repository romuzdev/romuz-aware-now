/**
 * M18: Incident Response - Active Incidents Page
 */

import { useState } from 'react';
import { PageHeader } from '@/core/components/ui/page-header';
import { useTranslation } from 'react-i18next';
import { useIncidents } from '../hooks/useIncidents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { AlertTriangle, Search, Filter, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ActiveIncidents() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incidents, isLoading } = useIncidents({
    status: 'open,investigating,contained',
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'investigating':
        return 'default';
      case 'contained':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredIncidents = incidents?.filter((incident) => {
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    const matchesSearch =
      !searchQuery ||
      incident.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.incident_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'الحوادث النشطة' : 'Active Incidents'}
        description={
          isRTL
            ? 'عرض وإدارة الحوادث الأمنية النشطة التي تتطلب انتباهك'
            : 'View and manage active security incidents requiring attention'
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {isRTL ? 'تصفية الحوادث' : 'Filter Incidents'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'ابحث عن حدث...' : 'Search incidents...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={isRTL ? 'مستوى الخطورة' : 'Severity Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? 'جميع المستويات' : 'All Levels'}
                </SelectItem>
                <SelectItem value="critical">
                  {isRTL ? 'حرجة' : 'Critical'}
                </SelectItem>
                <SelectItem value="high">{isRTL ? 'عالية' : 'High'}</SelectItem>
                <SelectItem value="medium">
                  {isRTL ? 'متوسطة' : 'Medium'}
                </SelectItem>
                <SelectItem value="low">
                  {isRTL ? 'منخفضة' : 'Low'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : filteredIncidents && filteredIncidents.length > 0 ? (
        <div className="grid gap-4">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <code className="text-sm font-mono">
                        {incident.incident_number}
                      </code>
                    </div>
                    <CardTitle className="mb-2">
                      {isRTL ? incident.title_ar : incident.title_en}
                    </CardTitle>
                    <CardDescription>
                      {isRTL ? incident.description_ar : incident.description_en}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/incident-response/incidents/${incident.id}`)
                    }
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    {isRTL ? 'عرض' : 'View'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant={getSeverityColor(incident.severity)}>
                    {isRTL
                      ? {
                          critical: 'حرجة',
                          high: 'عالية',
                          medium: 'متوسطة',
                          low: 'منخفضة',
                        }[incident.severity]
                      : incident.severity}
                  </Badge>
                  <Badge variant={getStatusColor(incident.status)}>
                    {isRTL
                      ? {
                          open: 'مفتوح',
                          investigating: 'قيد التحقيق',
                          contained: 'محتوى',
                          resolved: 'محلول',
                          closed: 'مغلق',
                        }[incident.status]
                      : incident.status}
                  </Badge>
                  <Badge variant="outline">
                    {isRTL
                      ? {
                          ransomware: 'برامج فدية',
                          data_breach: 'اختراق بيانات',
                          phishing: 'تصيد',
                          malware: 'برامج ضارة',
                          unauthorized_access: 'دخول غير مصرح',
                          ddos_attack: 'هجوم DDoS',
                          policy_violation: 'انتهاك سياسة',
                          social_engineering: 'هندسة اجتماعية',
                          insider_threat: 'تهديد داخلي',
                        }[incident.incident_type] || incident.incident_type
                      : incident.incident_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground mr-auto">
                    {isRTL ? 'منذ ' : ''}
                    {formatDistanceToNow(new Date(incident.detected_at), {
                      addSuffix: !isRTL,
                      locale: isRTL ? ar : undefined,
                    })}
                    {isRTL ? '' : ' ago'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isRTL
              ? 'لا توجد حوادث نشطة تطابق المعايير المحددة'
              : 'No active incidents match the selected criteria'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
