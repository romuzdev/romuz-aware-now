/**
 * TermsTreeView - Visual Hierarchy Tree Component
 * Gate-M: Interactive tree view for hierarchical terms with drag-drop
 */

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, GripVertical, Eye } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RefTerm } from '@/modules/master-data/types';

interface TermsTreeViewProps {
  terms: RefTerm[];
  onAddChild?: (parentId: string) => void;
  onEdit?: (term: RefTerm) => void;
  onDelete?: (termId: string) => void;
  onView?: (term: RefTerm) => void;
  onReorder?: (termIds: string[]) => void;
  searchTerm?: string;
}

interface TreeNode {
  term: RefTerm;
  children: TreeNode[];
  level: number;
}

function buildTree(terms: RefTerm[], parentId: string | null = null, level: number = 0): TreeNode[] {
  return terms
    .filter(t => t.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(term => ({
      term,
      children: buildTree(terms, term.id, level + 1),
      level,
    }));
}

function TreeNodeComponent({
  node,
  searchTerm,
  onAddChild,
  onEdit,
  onDelete,
  onView,
}: {
  node: TreeNode;
  searchTerm?: string;
  onAddChild?: (parentId: string) => void;
  onEdit?: (term: RefTerm) => void;
  onDelete?: (termId: string) => void;
  onView?: (term: RefTerm) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  const isHighlighted =
    searchTerm &&
    (node.term.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.term.labelAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.term.labelEn.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent transition-colors',
          isHighlighted && 'bg-primary/10'
        )}
        style={{ paddingRight: `${node.level * 1.5 + 0.75}rem` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-move" />

        {/* Term Info */}
        <div className="flex-1 flex items-center gap-3">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{node.term.code}</code>
          <span className="font-medium">{node.term.labelAr}</span>
          <span className="text-sm text-muted-foreground">{node.term.labelEn}</span>
          {!node.term.active && <Badge variant="secondary">غير نشط</Badge>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(node.term)}
              title="عرض التفاصيل"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onAddChild && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddChild(node.term.id)}
              title="إضافة مصطلح فرعي"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(node.term)}
              title="تعديل"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(node.term.id)}
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.term.id}
              node={child}
              searchTerm={searchTerm}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TermsTreeView({
  terms,
  onAddChild,
  onEdit,
  onDelete,
  onView,
  onReorder,
  searchTerm,
}: TermsTreeViewProps) {
  const tree = useMemo(() => buildTree(terms), [terms]);

  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <ChevronRight className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">لا توجد مصطلحات</h3>
        <p className="text-sm text-muted-foreground">قم بإضافة مصطلحات لرؤية الهيكل الهرمي</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="space-y-1">
        {tree.map(node => (
          <TreeNodeComponent
            key={node.term.id}
            node={node}
            searchTerm={searchTerm}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
        <span>إجمالي المصطلحات: {terms.length}</span>
        <span>الجذور: {tree.length}</span>
        <span>النشط: {terms.filter(t => t.active).length}</span>
      </div>
    </div>
  );
}
