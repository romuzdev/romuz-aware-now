/**
 * Version Compare Component
 * M10: Smart Documents Enhancement
 * Side-by-side comparison of two document versions
 */

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { GitCompare, FileText, Calendar, User, Hash, AlertCircle } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useCompareVersions } from '../hooks/useDocumentVersions';

interface VersionCompareProps {
  version1Id: string;
  version2Id: string;
}

export function VersionCompare({ version1Id, version2Id }: VersionCompareProps) {
  const { data, isLoading, error } = useCompareVersions(version1Id, version2Id);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  };

  const getSizeDifference = (size1: number, size2: number) => {
    const diff = size2 - size1;
    const diffPercent = ((diff / size1) * 100).toFixed(1);
    
    if (diff > 0) {
      return (
        <span className="text-green-600">
          +{formatFileSize(diff)} (+{diffPercent}%)
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-red-600">
          {formatFileSize(diff)} ({diffPercent}%)
        </span>
      );
    }
    return <span className="text-muted-foreground">لا يوجد تغيير</span>;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>فشل تحميل المقارنة: {error.message}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { version1, version2 } = data;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <GitCompare className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">مقارنة الإصدارات</h3>
          <p className="text-sm text-muted-foreground">
            مقارنة بين الإصدار {version1.version_number} والإصدار {version2.version_number}
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Version 1 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">الإصدار {version1.version_number}</h4>
            </div>
            <Badge variant={version1.is_major ? 'default' : 'secondary'}>
              {version1.is_major ? 'رئيسي' : 'فرعي'}
            </Badge>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">تاريخ الرفع</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(version1.uploaded_at), 'PPp', { locale: ar })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">الحجم</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(version1.file_size_bytes)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">نوع الملف</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {version1.mime_type}
                </p>
              </div>
            </div>

            {version1.change_summary && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ملخص التغييرات</p>
                    <p className="text-sm text-muted-foreground">
                      {version1.change_summary}
                    </p>
                  </div>
                </div>
              </>
            )}

            {version1.checksum && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Checksum</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {version1.checksum}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Version 2 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">الإصدار {version2.version_number}</h4>
            </div>
            <Badge variant={version2.is_major ? 'default' : 'secondary'}>
              {version2.is_major ? 'رئيسي' : 'فرعي'}
            </Badge>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">تاريخ الرفع</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(version2.uploaded_at), 'PPp', { locale: ar })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">الحجم</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(version2.file_size_bytes)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">نوع الملف</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {version2.mime_type}
                </p>
              </div>
            </div>

            {version2.change_summary && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ملخص التغييرات</p>
                    <p className="text-sm text-muted-foreground">
                      {version2.change_summary}
                    </p>
                  </div>
                </div>
              </>
            )}

            {version2.checksum && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Checksum</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {version2.checksum}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Differences Summary */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold mb-4">ملخص الاختلافات</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">فرق الحجم</p>
            <p className="text-lg font-semibold">
              {getSizeDifference(version1.file_size_bytes, version2.file_size_bytes)}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">فرق النوع</p>
            <p className="text-sm font-semibold">
              {version1.is_major === version2.is_major ? (
                <span className="text-muted-foreground">لا يوجد تغيير</span>
              ) : (
                <span className="text-blue-600">تغير النوع</span>
              )}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">نوع الملف</p>
            <p className="text-sm font-semibold">
              {version1.mime_type === version2.mime_type ? (
                <span className="text-muted-foreground">نفس النوع</span>
              ) : (
                <span className="text-orange-600">تغير النوع</span>
              )}
            </p>
          </Card>
        </div>
      </div>
    </Card>
  );
}
