/**
 * M13.1 - Content Hub Page
 * صفحة مكتبة المحتوى التوعوي
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { ContentLibrary, AIContentWizard, ContentAnalytics } from '@/modules/content-hub';
import { useNavigate } from 'react-router-dom';

export default function ContentHubPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [activeTab, setActiveTab] = useState('library');

  useEffect(() => {
    document.title = `${t('awareness.content.title')} | Romuz`;
  }, [t]);

  const handleCreateNew = () => {
    setShowAIWizard(true);
  };

  const handleItemClick = (item: any) => {
    // Navigate to content detail or edit page
    console.log('Item clicked:', item);
  };

  const handleEdit = (item: any) => {
    navigate(`/awareness/content/${item.id}/edit`);
  };

  const handleAIComplete = (generatedContent: any) => {
    console.log('AI generated content:', generatedContent);
    // TODO: Save the generated content
    setShowAIWizard(false);
  };

  return (
    <main className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold">{t('awareness.content.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('awareness.content.description') || 'مكتبة المحتوى التوعوي مع توليد ذكي بالـ AI'}
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library">المكتبة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <ContentLibrary
            onCreateNew={handleCreateNew}
            onItemClick={handleItemClick}
            onEdit={handleEdit}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ContentAnalytics />
        </TabsContent>
      </Tabs>

      {/* AI Content Wizard */}
      <AIContentWizard
        open={showAIWizard}
        onOpenChange={setShowAIWizard}
        onComplete={handleAIComplete}
      />
    </main>
  );
}
