/**
 * Documents Hub - Central Repository
 * Gate-D3: Documents Module - Multi-App Repository
 * 
 * Central document repository with sub-repositories for each app
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { 
  FileText, 
  FolderOpen, 
  Plus,
  BarChart3,
  Users,
  Shield,
  AlertTriangle,
  BookOpen,
  Users2
} from 'lucide-react';
import { useDocuments, useAppDocuments, AppDocumentsList } from '@/modules/documents';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

type AppCode = 'admin' | 'awareness' | 'compliance' | 'risks' | 'audits' | 'committees';

const APP_CONFIGS: Record<AppCode, { 
  label: string; 
  icon: typeof FileText; 
  color: string;
  description: string;
}> = {
  admin: {
    label: 'الإدارة',
    icon: Shield,
    color: 'text-purple-600',
    description: 'المستندات الإدارية والسياسات العامة',
  },
  awareness: {
    label: 'التوعية',
    icon: Users,
    color: 'text-blue-600',
    description: 'مواد التوعية والتدريب',
  },
  compliance: {
    label: 'الامتثال',
    icon: Shield,
    color: 'text-green-600',
    description: 'مستندات الامتثال والمطابقة',
  },
  risks: {
    label: 'المخاطر',
    icon: AlertTriangle,
    color: 'text-red-600',
    description: 'تقييمات المخاطر والخطط العلاجية',
  },
  audits: {
    label: 'المراجعة',
    icon: BookOpen,
    color: 'text-orange-600',
    description: 'تقارير المراجعة والتدقيق',
  },
  committees: {
    label: 'اللجان',
    icon: Users2,
    color: 'text-cyan-600',
    description: 'محاضر الاجتماعات والقرارات',
  },
};

export default function DocumentsHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const [activeTab, setActiveTab] = useState<'all' | AppCode>('all');

  // Fetch all documents for statistics
  const { documents: allDocuments, loading: loadingAll } = useDocuments();

  // App-specific hooks
  const { documents: adminDocs } = useAppDocuments({ appCode: 'admin', enableRealtime: false });
  const { documents: awarenessDocs } = useAppDocuments({ appCode: 'awareness', enableRealtime: false });
  const { documents: complianceDocs } = useAppDocuments({ appCode: 'compliance', enableRealtime: false });
  const { documents: risksDocs } = useAppDocuments({ appCode: 'risks', enableRealtime: false });
  const { documents: auditsDocs } = useAppDocuments({ appCode: 'audits', enableRealtime: false });
  const { documents: committeesDocs } = useAppDocuments({ appCode: 'committees', enableRealtime: false });

  // Shared/Unassigned documents (app_code = NULL)
  const sharedDocs = allDocuments.filter(d => !d.app_code);

  const appDocuments: Record<AppCode, any[]> = {
    admin: adminDocs,
    awareness: awarenessDocs,
    compliance: complianceDocs,
    risks: risksDocs,
    audits: auditsDocs,
    committees: committeesDocs,
  };

  const handleCreateNew = (appCode?: AppCode) => {
    // TODO: Open create document modal with pre-filled app_code
    console.log('Create new document for:', appCode || 'shared');
  };

  const handleEdit = (doc: any) => {
    navigate(`/admin/documents/${doc.id}`);
  };

  const handleDelete = async (doc: any) => {
    // TODO: Implement delete with confirmation
    console.log('Delete document:', doc.id);
  };

  const handleDownload = (doc: any) => {
    // TODO: Implement download
    console.log('Download document:', doc.id);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            المستودع المركزي للمستندات
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة جميع مستندات المنظمة من مكان واحد
          </p>
        </div>
        <Button onClick={() => handleCreateNew()} size="lg">
          <Plus className="h-5 w-5 ml-2" />
          إنشاء مستند جديد
        </Button>
      </header>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {/* Total */}
        <Card className="p-4">
          <div className="text-center">
            <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">الإجمالي</p>
            <p className="text-2xl font-bold">{allDocuments.length}</p>
          </div>
        </Card>

        {/* Per App */}
        {(Object.keys(APP_CONFIGS) as AppCode[]).map((appCode) => {
          const config = APP_CONFIGS[appCode];
          const Icon = config.icon;
          const count = appDocuments[appCode].length;

          return (
            <Card key={appCode} className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setActiveTab(appCode)}>
              <div className="text-center">
                <Icon className={`h-6 w-6 ${config.color} mx-auto mb-2`} />
                <p className="text-sm text-muted-foreground">{config.label}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tabs for Sub-Repositories */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الكل
          </TabsTrigger>

          {(Object.keys(APP_CONFIGS) as AppCode[]).map((appCode) => {
            const config = APP_CONFIGS[appCode];
            const Icon = config.icon;
            return (
              <TabsTrigger key={appCode} value={appCode} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* All Documents Tab */}
        <TabsContent value="all" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">جميع المستندات</h2>
              <p className="text-sm text-muted-foreground">
                عرض جميع المستندات من كافة التطبيقات
              </p>
            </div>
            <AppDocumentsList
              documents={allDocuments}
              loading={loadingAll}
              onCreateNew={() => handleCreateNew()}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownload={handleDownload}
              showActions={true}
              emptyMessage="لا توجد مستندات في المستودع بعد"
            />
          </Card>
        </TabsContent>

        {/* App-Specific Tabs */}
        {(Object.keys(APP_CONFIGS) as AppCode[]).map((appCode) => {
          const config = APP_CONFIGS[appCode];
          const docs = appDocuments[appCode];

          return (
            <TabsContent key={appCode} value={appCode} className="mt-6">
              <Card className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                    مستودع {config.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
                <AppDocumentsList
                  documents={docs}
                  loading={false}
                  onCreateNew={() => handleCreateNew(appCode)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  showActions={true}
                  emptyMessage={`لا توجد مستندات في مستودع ${config.label} بعد`}
                />
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Shared/Unassigned Documents Section */}
      {sharedDocs.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              المستندات المشتركة
            </h2>
            <p className="text-sm text-muted-foreground">
              مستندات غير مخصصة لتطبيق معين
            </p>
          </div>
          <AppDocumentsList
            documents={sharedDocs}
            loading={false}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDownload={handleDownload}
            showActions={true}
          />
        </Card>
      )}
    </div>
  );
}
