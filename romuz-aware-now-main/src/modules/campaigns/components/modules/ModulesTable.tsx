import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Check, X, ChevronUp, ChevronDown, Eye, Edit, Trash } from 'lucide-react';
import type { Module } from '@/modules/campaigns';

interface Props {
  modules: Module[];
  canManage: boolean;
  onEdit: (module: Module) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onPreview: (module: Module) => void;
}

export function ModulesTable({
  modules,
  canManage,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPreview,
}: Props) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Est. Minutes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No modules yet
              </TableCell>
            </TableRow>
          )}
          {modules.map((m, index) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.position}</TableCell>
              <TableCell>{m.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{getTypeLabel(m.type)}</Badge>
              </TableCell>
              <TableCell>
                {m.isRequired ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>{m.estimatedMinutes ? `${m.estimatedMinutes} min` : '—'}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onPreview(m)}
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {canManage && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMoveUp(m.id)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMoveDown(m.id)}
                        disabled={index === modules.length - 1}
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => onEdit(m)} title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(m.id)}
                        title="Delete"
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'article':
      return 'Article';
    case 'video':
      return 'Video';
    case 'link':
      return 'Link';
    case 'file':
      return 'File';
    default:
      return type;
  }
}
