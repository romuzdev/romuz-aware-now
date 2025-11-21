import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import { Badge } from "@/core/components/ui/badge";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { useAuditLog } from "@/core/hooks";
import { Skeleton } from "@/core/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function AuditLog() {
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, error } = useAuditLog({
    entityType: entityType || undefined,
    action: action || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const entries = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Filter by search term on client side
  const filteredEntries = searchTerm
    ? entries.filter(
        (entry) =>
          entry.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.actor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : entries;

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("delete")) return "destructive";
    if (action.includes("create")) return "default";
    if (action.includes("update")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">سجل التدقيق</h1>
        <p className="mt-2 text-muted-foreground">
          سجل كامل لجميع العمليات والإجراءات في النظام
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
          <CardDescription>
            ابحث وفلتر سجلات التدقيق حسب النوع والإجراء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في المعرف أو المستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الكيان</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="grc_audit">تدقيق GRC</SelectItem>
                  <SelectItem value="audit_workflow">سير عمل التدقيق</SelectItem>
                  <SelectItem value="audit_finding">نتيجة تدقيق</SelectItem>
                  <SelectItem value="campaign">حملة</SelectItem>
                  <SelectItem value="committee">لجنة</SelectItem>
                  <SelectItem value="meeting">اجتماع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الإجراء</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الإجراءات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الإجراءات</SelectItem>
                  <SelectItem value="create">إنشاء</SelectItem>
                  <SelectItem value="read">قراءة</SelectItem>
                  <SelectItem value="update">تحديث</SelectItem>
                  <SelectItem value="delete">حذف</SelectItem>
                  <SelectItem value="workflow_start">بدء سير العمل</SelectItem>
                  <SelectItem value="workflow_complete">إكمال سير العمل</SelectItem>
                  <SelectItem value="finding_add">إضافة نتيجة</SelectItem>
                  <SelectItem value="finding_resolve">حل نتيجة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEntityType("");
                setAction("");
                setSearchTerm("");
                setPage(0);
              }}
            >
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>السجلات ({totalCount})</CardTitle>
          <CardDescription>
            عرض {filteredEntries.length} من {totalCount} سجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              حدث خطأ في تحميل السجلات: {String(error)}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات تدقيق
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوقت</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>نوع الكيان</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>معرف الكيان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {format(
                            new Date(entry.created_at),
                            "yyyy-MM-dd HH:mm:ss",
                            { locale: ar }
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.actor.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.entity_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(entry.action)}>
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {entry.entity_id.substring(0, 8)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    صفحة {page + 1} من {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
