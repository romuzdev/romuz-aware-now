/**
 * Job Template Selector
 * Dialog for browsing and selecting job templates
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  JOB_TEMPLATES,
  getTemplatesByCategory,
  getCategories,
  type JobTemplate,
} from '@/lib/constants/jobTemplates';
import {
  BarChart3,
  FileText,
  Bell,
  Users,
  Database,
  Search,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_ICONS = {
  kpi: BarChart3,
  report: FileText,
  alert: Bell,
  awareness: Users,
  maintenance: Database,
};

interface JobTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: JobTemplate) => void;
}

export default function JobTemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
}: JobTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = getCategories();

  const filteredTemplates = JOB_TEMPLATES.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description_ar.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: JobTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>اختر نموذج وظيفة</DialogTitle>
          <DialogDescription>
            اختر نموذجاً جاهزاً وقم بتخصيصه حسب احتياجاتك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن نموذج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">الكل</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label_ar}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {filteredTemplates.map((template) => {
                  const Icon = CATEGORY_ICONS[template.category];
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {template.name_ar}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {template.name_en}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.value === template.category)?.label_ar}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description_ar}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="font-mono">{template.recommended_schedule}</span>
                          <span>•</span>
                          <span>{template.schedule_description_ar}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {template.default_config.is_enabled ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                              مفعّل افتراضياً
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              معطّل افتراضياً
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {template.default_config.gate_code}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم العثور على نماذج تطابق البحث</p>
                </div>
              )}
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
