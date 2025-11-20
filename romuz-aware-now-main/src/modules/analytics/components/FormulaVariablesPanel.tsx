/**
 * M14 Enhancement - Formula Variables Panel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Plus, Lightbulb } from 'lucide-react';
import { FORMULA_VARIABLES } from '../integration/custom-kpi-formulas.integration';
import { FORMULA_EXAMPLES } from '../utils/formula-evaluator';

interface FormulaVariablesPanelProps {
  onVariableInsert: (variable: string) => void;
  onExampleSelect: (example: typeof FORMULA_EXAMPLES[0]) => void;
}

export function FormulaVariablesPanel({
  onVariableInsert,
  onExampleSelect
}: FormulaVariablesPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">المكونات المتاحة</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="variables" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="variables" className="flex-1">المتغيرات</TabsTrigger>
            <TabsTrigger value="examples" className="flex-1">أمثلة</TabsTrigger>
          </TabsList>

          {/* Variables Tab */}
          <TabsContent value="variables" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {FORMULA_VARIABLES.map((variable) => (
                  <div
                    key={variable.name}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{variable.label}</div>
                        <code className="text-xs text-muted-foreground">{variable.example}</code>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onVariableInsert(variable.name)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {variable.description && (
                      <p className="text-xs text-muted-foreground">{variable.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {FORMULA_EXAMPLES.map((example, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onExampleSelect(example)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">{example.name}</div>
                        <div className="bg-muted p-2 rounded text-xs font-mono mb-2">
                          {example.formula}
                        </div>
                        <p className="text-xs text-muted-foreground">{example.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      انقر للاستخدام
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
