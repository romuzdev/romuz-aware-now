import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { fetchAgendaItems, updateAgendaItem } from '@/modules/committees/integration';
import { useCan } from '@/core/rbac';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';

interface AgendaTabProps {
  meetingId: string;
}

export default function MeetingAgendaTab({ meetingId }: AgendaTabProps) {
  const { t } = useTranslation();
  const can = useCan();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);

  const { data: agendaItems, isLoading } = useQuery({
    queryKey: ['meeting-agenda', meetingId],
    queryFn: () => fetchAgendaItems(meetingId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (agendaItems) {
      setItems(agendaItems);
    }
  }, [agendaItems]);

  const updateSequenceMutation = useMutation({
    mutationFn: ({ id, sequence }: { id: string; sequence: number }) =>
      updateAgendaItem(id, { sequence }),
    onError: (error: Error) => {
      toast({
        title: 'Failed to update sequence',
        description: error.message,
        variant: 'destructive',
      });
      // Revert on error
      if (agendaItems) {
        setItems(agendaItems);
      }
    },
  });

  const canManage = can('meeting.manage');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !canManage) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Update sequences
    const updated = reordered.map((item, index) => ({
      ...item,
      sequence: index + 1,
    }));

    setItems(updated);

    // Update each item's sequence in the database
    updated.forEach((item, index) => {
      if (item.sequence !== agendaItems?.[index]?.sequence) {
        updateSequenceMutation.mutate({
          id: item.id,
          sequence: item.sequence,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('meetings.agenda.title')}</CardTitle>
          {canManage && (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('meetings.actions.addAgendaItem')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="agenda-items">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                      isDragDisabled={!canManage}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 border rounded-lg ${
                            snapshot.isDragging ? 'bg-muted' : 'hover:bg-muted/50'
                          }`}
                        >
                          {canManage && (
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                            </div>
                          )}
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {item.sequence}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.subject}</h4>
                            {item.presenter && (
                              <p className="text-sm text-muted-foreground">
                                {t('meetings.agenda.presenter')}: {item.presenter}
                              </p>
                            )}
                          </div>
                          {item.duration_minutes && (
                            <div className="text-sm text-muted-foreground">
                              {item.duration_minutes} {t('meetings.agenda.durationMinutes')}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('meetings.agenda.noItems')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
