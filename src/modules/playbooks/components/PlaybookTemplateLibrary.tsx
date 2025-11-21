/**
 * M18 Part 2: Playbook Template Library Component
 * Browse and select from pre-built playbook templates
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { usePlaybookManagement } from '@/modules/playbooks/hooks';
import { 
  Search, 
  FileText, 
  Clock, 
  Star, 
  Copy, 
  Shield, 
  AlertTriangle,
  Bug,
  Lock,
  Database
} from 'lucide-react';

interface PlaybookTemplateLibraryProps {
  onSelectTemplate?: (template: any) => void;
}

export function PlaybookTemplateLibrary({ onSelectTemplate }: PlaybookTemplateLibraryProps) {
  const { templates, templatesLoading } = usePlaybookManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Template categories with icons
  const categories = [
    { id: 'all', name: 'الكل', icon: FileText },
    { id: 'security', name: 'حوادث أمنية', icon: Shield },
    { id: 'incident', name: 'استجابة للحوادث', icon: AlertTriangle },
    { id: 'malware', name: 'برمجيات ضارة', icon: Bug },
    { id: 'access', name: 'التحكم في الوصول', icon: Lock },
    { id: 'data', name: 'حماية البيانات', icon: Database },
  ];

  const getCategoryIcon = (category: string) => {
    const categoryConfig = categories.find(c => c.id === category);
    const Icon = categoryConfig?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const filteredTemplates = templates?.filter((template) => {
    const playbookName = template.description_ar || template.description_en || '';
    const matchesSearch = playbookName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      template.template_category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  const handleUseTemplate = (template: any) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">مكتبة قوالب Playbooks</h2>
        <p className="text-muted-foreground">
          اختر من القوالب المعدة مسبقاً لتسريع إنشاء Playbooks
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث في القوالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollArea>

        <TabsContent value={selectedCategory} className="mt-6">
          {templatesLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(template.template_category || 'all')}
                        <CardTitle className="text-lg">{template.description_ar || template.description_en || 'Playbook'}</CardTitle>
                      </div>
                      {template.success_rate_pct && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {template.success_rate_pct.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {template.description_ar || template.description_en}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Template Metadata */}
                    <div className="flex flex-wrap gap-2">
                      {template.template_category && (
                        <Badge variant="outline">
                          {categories.find(c => c.id === template.template_category)?.name || 
                           template.template_category}
                        </Badge>
                      )}
                      {template.execution_mode && (
                        <Badge variant="outline">
                          {template.execution_mode === 'automatic' ? 'تلقائي' : 'يدوي'}
                        </Badge>
                      )}
                    </div>

                    {/* Template Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{template.estimated_duration_minutes || 30} دقيقة</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        <span>{template.execution_count || 0} استخدام</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full"
                      variant="outline"
                    >
                      <Copy className="h-4 w-4 ml-2" />
                      استخدام هذا القالب
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد قوالب متاحة</p>
              <p className="text-sm text-muted-foreground mt-2">
                جرب تغيير الفئة أو مصطلح البحث
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
