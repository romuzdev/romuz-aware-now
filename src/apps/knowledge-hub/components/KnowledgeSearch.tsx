/**
 * M17: Knowledge Hub - KnowledgeSearch Component
 * Smart search interface with semantic search capabilities
 */

import { useState } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useKnowledgeSearch } from '../hooks/useKnowledgeSearch';
import { DocumentCard } from './DocumentCard';

export function KnowledgeSearch() {
  const {
    query,
    filters,
    results,
    count,
    isLoading,
    handleSearch,
    updateFilters,
  } = useKnowledgeSearch();

  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث في قاعدة المعرفة باستخدام البحث الذكي..."
                className="pr-10"
              />
            </div>
            <Button type="submit" disabled={!searchInput.trim()}>
              <Sparkles className="ml-2 h-4 w-4" />
              بحث ذكي
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Select
              value={filters.documentType}
              onValueChange={(value) =>
                updateFilters({ documentType: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue placeholder="نوع المستند" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="policy">سياسة</SelectItem>
                <SelectItem value="procedure">إجراء</SelectItem>
                <SelectItem value="guideline">إرشادات</SelectItem>
                <SelectItem value="standard">معيار</SelectItem>
                <SelectItem value="best_practice">أفضل ممارسة</SelectItem>
                <SelectItem value="case_study">دراسة حالة</SelectItem>
                <SelectItem value="regulation">نظام</SelectItem>
                <SelectItem value="faq">أسئلة شائعة</SelectItem>
                <SelectItem value="training">تدريب</SelectItem>
                <SelectItem value="template">قالب</SelectItem>
              </SelectContent>
            </Select>

            {filters.documentType && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => updateFilters({ documentType: undefined })}
              >
                {filters.documentType}
                <span className="mr-2">×</span>
              </Badge>
            )}
          </div>
        </form>
      </Card>

      {/* Results */}
      {query && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isLoading ? 'جاري البحث...' : `${count} نتيجة`}
            </h2>
            {!isLoading && count > 0 && (
              <p className="text-sm text-muted-foreground">
                البحث الدلالي الذكي • مرتبة حسب الأهمية
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </Card>
              ))}
            </div>
          ) : count === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">لم يتم العثور على نتائج</p>
              <p className="text-muted-foreground">
                جرب استخدام كلمات مفتاحية مختلفة أو قم بإزالة الفلاتر
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  similarity={doc.similarity}
                  showSimilarity
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!query && (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">البحث الذكي في قاعدة المعرفة</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            ابحث باستخدام الذكاء الاصطناعي للعثور على المعلومات الأكثر صلة بسؤالك.
            البحث الدلالي يفهم معنى كلماتك وليس فقط الكلمات المطابقة.
          </p>
        </Card>
      )}
    </div>
  );
}
