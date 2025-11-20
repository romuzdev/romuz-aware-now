/**
 * GRC Documents Page
 * Gate-D3: Multi-App Documents Repository
 * 
 * Documents repository for GRC app (Risks & Compliance)
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Plus, FileText, FolderOpen, Shield, AlertTriangle } from 'lucide-react';
import { useAppDocuments, AppDocumentsList, CreateDocumentModal } from '@/modules/documents';
import { useNavigate } from 'react-router-dom';

export default function GRCDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'risks' | 'compliance'>('risks');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentAppCode, setCurrentAppCode] = useState<'risks' | 'compliance'>('risks');

  // Fetch documents for both sub-repositories
  const { documents: risksDocs, loading: loadingRisks, total: totalRisks } = useAppDocuments({ 
    appCode: 'risks' 
  });
  
  const { documents: complianceDocs, loading: loadingCompliance, total: totalCompliance } = useAppDocuments({ 
    appCode: 'compliance' 
  });

  useEffect(() => {
    document.title = `${t('grc.documents.title')} | Romuz`;
  }, [t]);

  const handleCreateNew = (appCode: 'risks' | 'compliance') => {
    setCurrentAppCode(appCode);
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
            {t('grc.documents.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('grc.documents.description')}
          </p>
        </div>
        <Button onClick={() => handleCreateNew(activeTab)} size="lg">
          <Plus className="h-5 w-5 ml-2" />
          إنشاء مستند جديد
        </Button>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
              <p className="text-2xl font-semibold">{totalRisks + totalCompliance}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setActiveTab('risks')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مستندات المخاطر</p>
              <p className="text-2xl font-semibold">{totalRisks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setActiveTab('compliance')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مستندات الامتثال</p>
              <p className="text-2xl font-semibold">{totalCompliance}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            المخاطر
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الامتثال
          </TabsTrigger>
        </TabsList>

        {/* Risks Documents Tab */}
        <TabsContent value="risks" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                مستودع مستندات المخاطر
              </h2>
              <p className="text-sm text-muted-foreground">
                تقييمات المخاطر، الخطط العلاجية، وتقارير التحليل
              </p>
            </div>
            <AppDocumentsList
              documents={risksDocs}
              loading={loadingRisks}
              onCreateNew={() => handleCreateNew('risks')}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownload={handleDownload}
              showActions={true}
              emptyMessage="لا توجد مستندات مخاطر بعد. ابدأ بإنشاء أول مستند!"
            />
          </Card>
        </TabsContent>

        {/* Compliance Documents Tab */}
        <TabsContent value="compliance" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                مستودع مستندات الامتثال
              </h2>
              <p className="text-sm text-muted-foreground">
                مستندات المطابقة، التراخيص، وتقارير الامتثال
              </p>
            </div>
            <AppDocumentsList
              documents={complianceDocs}
              loading={loadingCompliance}
              onCreateNew={() => handleCreateNew('compliance')}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownload={handleDownload}
              showActions={true}
              emptyMessage="لا توجد مستندات امتثال بعد. ابدأ بإنشاء أول مستند!"
            />
          </Card>
        </TabsContent>
      </Tabs>
      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleDocumentCreated}
        appCode={currentAppCode}
      />
    </main>
  );
}
