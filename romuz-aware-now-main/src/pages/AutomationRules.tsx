/**
 * Automation Rules Management Page
 * 
 * صفحة إدارة قواعد الأتمتة
 */

import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { RulesList } from '@/components/automation/RulesList';
import { RuleBuilder } from '@/components/automation/RuleBuilder';
import { RuleTester } from '@/components/automation/RuleTester';
import type { AutomationRule } from '@/lib/events/event.types';

export default function AutomationRules() {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'test'>('list');
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);

  const handleCreateNew = () => {
    setSelectedRule(null);
    setView('create');
  };

  const handleEdit = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setView('edit');
  };

  const handleTest = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setView('test');
  };

  const handleBack = () => {
    setSelectedRule(null);
    setView('list');
  };

  const handleSave = (rule: Partial<AutomationRule>) => {
    console.log('حفظ القاعدة:', rule);
    // TODO: استدعاء API للحفظ
    setView('list');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">قواعد الأتمتة</h1>
            <p className="text-muted-foreground mt-1">
              إدارة قواعد الأتمتة والإجراءات التلقائية
            </p>
          </div>

          {view === 'list' && (
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              قاعدة جديدة
            </Button>
          )}

          {view !== 'list' && (
            <Button onClick={handleBack} variant="outline">
              رجوع
            </Button>
          )}
        </div>

        {/* Main Content */}
        {view === 'list' && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="بحث في القواعد..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Filter by Status */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterEnabled === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterEnabled(null)}
                    >
                      الكل
                    </Button>
                    <Button
                      variant={filterEnabled === true ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterEnabled(true)}
                    >
                      مفعّلة
                    </Button>
                    <Button
                      variant={filterEnabled === false ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterEnabled(false)}
                    >
                      معطّلة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules List */}
            <RulesList
              searchQuery={searchQuery}
              filterEnabled={filterEnabled}
              onEdit={handleEdit}
              onTest={handleTest}
            />
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <RuleBuilder
            rule={selectedRule}
            onSave={handleSave}
            onCancel={handleBack}
          />
        )}

        {view === 'test' && selectedRule && (
          <RuleTester
            rule={selectedRule}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
