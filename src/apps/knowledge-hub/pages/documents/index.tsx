/**
 * M17: Knowledge Hub - Documents List Page
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { useKnowledgeDocuments } from '../../hooks/useKnowledgeDocuments';
import { DocumentCard } from '../../components/DocumentCard';
import { KnowledgeFilters } from '../../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

export default function DocumentsPage() {
  const [filters, setFilters] = useState<KnowledgeFilters>({});
  const { documents, isLoading } = useKnowledgeDocuments(filters);

  useEffect(() => {
    document.title = 'المستندات | مركز المعرفة';
  }, []);

  return (
    <main className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المستندات المعرفية</h1>
          <p className="text-muted-foreground mt-2">
            {documents.length} مستند
          </p>
        </div>
        <Link to="/knowledge-hub/documents/create">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة مستند
          </Button>
        </Link>
      </header>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={filters.documentType}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, documentType: value as any }))
          }
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="ml-2 h-4 w-4" />
            <SelectValue placeholder="نوع المستند" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="policy">سياسة</SelectItem>
            <SelectItem value="procedure">إجراء</SelectItem>
            <SelectItem value="guideline">إرشادات</SelectItem>
            <SelectItem value="standard">معيار</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Link key={doc.id} to={`/knowledge-hub/documents/${doc.id}`}>
            <DocumentCard document={doc} />
          </Link>
        ))}
      </div>
    </main>
  );
}
