/**
 * App Documents List Component
 * Gate-D3: Documents Module - Multi-App Repository
 * 
 * Reusable component for displaying documents filtered by app_code
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/core/components/ui/table';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Document, DocumentStatus, DocumentType } from '../types';

interface AppDocumentsListProps {
  documents: Document[];
  loading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  showActions?: boolean;
  emptyMessage?: string;
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
  review: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  approved: 'bg-green-500/10 text-green-700 dark:text-green-300',
  published: 'bg-primary/10 text-primary',
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  archived: 'bg-muted text-muted-foreground',
};

const TYPE_COLORS: Record<DocumentType, string> = {
  policy: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  procedure: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  guideline: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  template: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  report: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  awareness_material: 'bg-green-500/10 text-green-700 dark:text-green-300',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
};

export function AppDocumentsList({
  documents,
  loading = false,
  onCreateNew,
  onEdit,
  onDelete,
  onDownload,
  showActions = true,
  emptyMessage,
}: AppDocumentsListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.doc_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('documents.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder={t('documents.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('documents.allStatuses')}</SelectItem>
            <SelectItem value="draft">{t('documents.status.draft')}</SelectItem>
            <SelectItem value="review">{t('documents.status.review')}</SelectItem>
            <SelectItem value="approved">{t('documents.status.approved')}</SelectItem>
            <SelectItem value="published">{t('documents.status.published')}</SelectItem>
            <SelectItem value="active">{t('documents.status.active')}</SelectItem>
            <SelectItem value="archived">{t('documents.status.archived')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder={t('documents.filterByType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('documents.allTypes')}</SelectItem>
            <SelectItem value="policy">{t('documents.type.policy')}</SelectItem>
            <SelectItem value="procedure">{t('documents.type.procedure')}</SelectItem>
            <SelectItem value="guideline">{t('documents.type.guideline')}</SelectItem>
            <SelectItem value="template">{t('documents.type.template')}</SelectItem>
            <SelectItem value="report">{t('documents.type.report')}</SelectItem>
            <SelectItem value="awareness_material">{t('documents.type.awareness_material')}</SelectItem>
            <SelectItem value="other">{t('documents.type.other')}</SelectItem>
          </SelectContent>
        </Select>

        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 ml-2" />
            {t('documents.createNew')}
          </Button>
        )}
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {emptyMessage || t('documents.noDocumentsFound')}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('documents.title')}</TableHead>
                <TableHead>{t('documents.type')}</TableHead>
                <TableHead>{t('documents.status')}</TableHead>
                <TableHead>{t('documents.updatedAt')}</TableHead>
                {showActions && <TableHead className="text-left">{t('common.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      {doc.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {doc.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={TYPE_COLORS[doc.doc_type]}>
                      {t(`documents.type.${doc.doc_type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[doc.status]}>
                      {t(`documents.status.${doc.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(doc.updated_at), 'PPp', {
                      locale: isRTL ? ar : undefined,
                    })}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(doc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results Summary */}
      {filteredDocuments.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {t('documents.showingResults', {
            count: filteredDocuments.length,
            total: documents.length,
          })}
        </div>
      )}
    </div>
  );
}
