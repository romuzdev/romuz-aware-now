/**
 * Audit Documents Page
 * Gate-D3: Multi-App Documents Repository
 * 
 * Documents repository for Audit app
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Plus, FileText, FolderOpen, BookOpen } from 'lucide-react';
import { useAppDocuments, AppDocumentsList, CreateDocumentModal } from '@/modules/documents';
import { useNavigate } from 'react-router-dom';

export default function AuditDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { documents, loading, total } = useAppDocuments({ 
    appCode: 'audits' 
  });

  useEffect(() => {
    document.title = `${t('audit.documents.title')} | Romuz`;
  }, [t]);

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleDocumentCreated = (documentId: string) => {
    navigate(`/admin/documents/${documentId}`);
  };

  const handleEdit = (doc: any) => {
    navigate(`/admin/documents/${doc.id}`);
  };

  const handleDelete = async (doc: any) => {
    // TODO: Implement delete
    console.log('Delete document:', doc.id);
  };

  const handleDownload = (doc: any) => {
    // TODO: Implement download
    console.log('Download document:', doc.id);
  };

  return (
    <main className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            {t('audit.documents.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('audit.documents.description')}
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="h-5 w-5 ml-2" />
          إنشاء مستند جديد
        </Button>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
              <p className="text-2xl font-semibold">{total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تقارير نشطة</p>
              <p className="text-2xl font-semibold">
                {documents.filter(d => d.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مكتملة</p>
              <p className="text-2xl font-semibold">
                {documents.filter(d => d.status === 'approved').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-2xl font-semibold">
                {documents.filter(d => d.status === 'review').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Documents List */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            مستندات المراجعة والتدقيق
          </h2>
          <p className="text-sm text-muted-foreground">
            تقارير المراجعة الداخلية، التدقيق الخارجي، والتوصيات
          </p>
        </div>
        <AppDocumentsList
          documents={documents}
          loading={loading}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownload={handleDownload}
          showActions={true}
          emptyMessage="لا توجد مستندات مراجعة بعد. ابدأ بإنشاء أول تقرير!"
        />
      </Card>
      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleDocumentCreated}
        appCode="audits"
      />
    </main>
  );
}
