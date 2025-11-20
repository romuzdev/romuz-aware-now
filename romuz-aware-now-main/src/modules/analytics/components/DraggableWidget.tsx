/**
 * M14 Enhancement - Draggable Widget Wrapper
 */

import { ReactNode } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableWidgetProps {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  isDragDisabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function DraggableWidget({
  id,
  index,
  title,
  children,
  onRemove,
  isDragDisabled = false,
  size = 'medium'
}: DraggableWidgetProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 lg:col-span-1',
    large: 'col-span-1 lg:col-span-2'
  };

  return (
    <Draggable draggableId={id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            sizeClasses[size],
            snapshot.isDragging && 'opacity-50'
          )}
        >
          <Card className={cn(
            'relative overflow-hidden transition-shadow',
            snapshot.isDragging && 'shadow-lg ring-2 ring-primary'
          )}>
            {/* Drag Handle */}
            {!isDragDisabled && (
              <div
                {...provided.dragHandleProps}
                className="absolute top-2 right-2 z-10 cursor-move hover:bg-muted rounded p-1 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            {/* Remove Button */}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 left-2 z-10 h-8 w-8 p-0"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Widget Content */}
            <div className={cn(!isDragDisabled && 'pt-8')}>
              {children}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
