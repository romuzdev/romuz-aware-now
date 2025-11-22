/**
 * Framework Mapping Tools Page
 * Map controls across different compliance frameworks
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { 
  GitBranch, 
  Search, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Shield,
  Sparkles
} from 'lucide-react';
import { useControlMappingSuggestions, useApplyControlMapping } from '@/modules/grc/hooks';
import { toast } from 'sonner';

export default function FrameworkMapping() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<'nca' | 'iso27001' | 'nist'>('nca');
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>('');
  
  const { data: mappingSuggestions, isLoading } = useControlMappingSuggestions(selectedRequirementId);
  const applyMapping = useApplyControlMapping();

  const frameworks = [
    {
      id: 'nca',
      name: 'NCA ECC',
      description: 'إطار الضوابط الأساسية للأمن السيبراني - الهيئة الوطنية للأمن السيبراني',
      color: 'bg-blue-500',
      controls: 114,
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'المعيار الدولي لأنظمة إدارة أمن المعلومات',
      color: 'bg-purple-500',
      controls: 93,
    },
    {
      id: 'nist',
      name: 'NIST CSF',
      description: 'إطار عمل الأمن السيبراني من المعهد الوطني للمعايير والتقنية',
      color: 'bg-green-500',
      controls: 108,
    },
  ];

  const handleApplyMapping = async (requirementId: string, controlId: string) => {
    try {
      await applyMapping.mutateAsync({
        requirementId,
        controlId,
        mappingType: 'primary',
      });
      toast.success('تم تطبيق الربط بنجاح');
    } catch (error) {
      toast.error('فشل تطبيق الربط');
    }
  };

  const filteredSuggestions = mappingSuggestions?.filter(suggestion =>
    suggestion.control_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suggestion.control_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <GitBranch className="h-8 w-8" />
          أدوات ربط الأطر
        </h1>
        <p className="text-muted-foreground mt-2">
          ربط وتعيين الضوابط بين الأطر المختلفة للامتثال
        </p>
      </div>

      <Tabs defaultValue="mapping" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapping">الربط الذكي</TabsTrigger>
          <TabsTrigger value="frameworks">الأطر المتاحة</TabsTrigger>
          <TabsTrigger value="coverage">تحليل التغطية</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                اقتراحات الربط الذكي
              </CardTitle>
              <CardDescription>
                اقتراحات آلية لربط الضوابط بناءً على التشابه والمتطلبات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في الضوابط..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex gap-2">
                  {frameworks.map((framework) => (
                    <Button
                      key={framework.id}
                      variant={selectedFramework === framework.id ? 'default' : 'outline'}
                      onClick={() => setSelectedFramework(framework.id as any)}
                    >
                      {framework.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapping Suggestions */}
          <div className="space-y-3">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  جاري تحليل الضوابط...
                </CardContent>
              </Card>
            ) : !selectedRequirementId ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  الرجاء تحديد متطلب لعرض اقتراحات الربط
                </CardContent>
              </Card>
            ) : filteredSuggestions?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا توجد اقتراحات ربط متاحة
                </CardContent>
              </Card>
            ) : (
              filteredSuggestions?.map((suggestion, index) => (
                <Card key={index} className="hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">الضابط المقترح</span>
                            </div>
                            <p className="text-sm text-foreground font-mono bg-muted p-2 rounded">
                              {suggestion.control_code}: {suggestion.control_title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            تطابق {(suggestion.match_score * 100).toFixed(0)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {suggestion.match_reason}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleApplyMapping(selectedRequirementId, suggestion.control_id)}
                        disabled={applyMapping.isPending}
                        size="sm"
                      >
                        تطبيق الربط
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`w-2 h-2 rounded-full ${framework.color}`} />
                    <Badge variant="outline">{framework.controls} ضابط</Badge>
                  </div>
                  <CardTitle>{framework.name}</CardTitle>
                  <CardDescription>{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" size="sm">
                    <FileText className="ml-2 h-4 w-4" />
                    عرض التفاصيل
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل تغطية الأطر</CardTitle>
              <CardDescription>نسبة تغطية الضوابط لكل إطار</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {frameworks.map((framework) => {
                  const coverage = Math.floor(Math.random() * 30) + 70; // Mock data
                  return (
                    <div key={framework.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{framework.name}</span>
                        <span className="text-sm text-muted-foreground">{coverage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${framework.color}`}
                          style={{ width: `${coverage}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        {Math.floor(framework.controls * coverage / 100)} من {framework.controls} ضابط مغطى
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
