/**
 * Kanban Board Component
 * M11: Kanban/Board view for action plans
 */

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import { Input } from '@/core/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  LayoutGrid,
  Search,
  MoreVertical,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
  Shield,
  Filter,
} from 'lucide-react';
import { useGateHActions, useUpdateActionStatus } from '../hooks';
import type { GateHActionItemRow, GateHActionStatus } from '../types/actions.types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLUMNS: { id: GateHActionStatus; label: string; icon: any; color: string }[] = [
  { id: 'new', label: 'جديد', icon: Circle, color: 'text-blue-600' },
  { id: 'in_progress', label: 'قيد التنفيذ', icon: PlayCircle, color: 'text-yellow-600' },
  { id: 'blocked', label: 'محظور', icon: XCircle, color: 'text-red-600' },
  { id: 'verify', label: 'للتحقق', icon: Shield, color: 'text-purple-600' },
  { id: 'closed', label: 'مغلق', icon: CheckCircle2, color: 'text-green-600' },
];

interface KanbanBoardProps {
  tenantId?: string;
}

export function KanbanBoard({ tenantId }: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allActions = [], isLoading } = useGateHActions();
  const updateStatus = useUpdateActionStatus();

  // Filter actions by search
  const filteredActions = allActions.filter((action) =>
    action.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (action.desc_ar && action.desc_ar.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group actions by status
  const actionsByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = filteredActions.filter((action) => action.status === column.id);
    return acc;
  }, {} as Record<GateHActionStatus, GateHActionItemRow[]>);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as GateHActionStatus;
    const actionId = draggableId;

    // Update action status
    updateStatus.mutate({
      actionId: actionId,
      newStatus: newStatus,
      noteAr: `تم تحديث الحالة إلى ${newStatus} عبر لوحة كانبان`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'حرجة',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return labels[priority] || priority;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>لوحة كانبان</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  اسحب وأفلت الإجراءات لتحديث حالتها
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {filteredActions.length} إجراء
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في الإجراءات..."
                className="pr-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNS.map((column) => {
            const columnActions = actionsByStatus[column.id] || [];
            const Icon = column.icon;

            return (
              <div key={column.id} className="flex flex-col">
                {/* Column Header */}
                <Card className="mb-3">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${column.color}`} />
                        <h3 className="font-semibold text-sm">{column.label}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {columnActions.length}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 p-2 rounded-lg transition-colors min-h-[300px] ${
                        snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
                      }`}
                    >
                      {columnActions.map((action, index) => (
                        <Draggable
                          key={action.id}
                          draggableId={action.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move transition-shadow hover:shadow-lg ${
                                snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary' : ''
                              }`}
                            >
                              <CardContent className="p-4 space-y-3">
                                {/* Title & Actions */}
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-medium line-clamp-2 flex-1">
                                    {action.title_ar}
                                  </h4>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                                      <DropdownMenuItem>تعديل</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive">
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Priority */}
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(action.priority)}`}
                                >
                                  {getPriorityLabel(action.priority)}
                                </Badge>

                                {/* Due Date */}
                                {action.due_date && (
                                  <div
                                    className={`flex items-center gap-2 text-xs ${
                                      isOverdue(action.due_date)
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {isOverdue(action.due_date) ? (
                                      <AlertCircle className="h-3 w-3" />
                                    ) : (
                                      <Calendar className="h-3 w-3" />
                                    )}
                                    <span>
                                      {formatDistanceToNow(new Date(action.due_date), {
                                        addSuffix: true,
                                        locale: ar,
                                      })}
                                    </span>
                                  </div>
                                )}

                                {/* Assignee */}
                                {action.assignee_user_id && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {action.assignee_user_id.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                      مكلف
                                    </span>
                                  </div>
                                )}

                                {/* Tags */}
                                {action.tags && action.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {action.tags.slice(0, 2).map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs px-2 py-0"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                    {action.tags.length > 2 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs px-2 py-0"
                                      >
                                        +{action.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty State */}
                      {columnActions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          لا توجد إجراءات
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
