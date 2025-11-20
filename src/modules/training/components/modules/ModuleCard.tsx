import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import type { CourseModule } from '../../types';

interface ModuleCardProps {
  module: CourseModule;
  onEdit?: (module: CourseModule) => void;
  onDelete?: (id: string) => void;
  onAddLesson?: (moduleId: string) => void;
  isDragging?: boolean;
}

export function ModuleCard({ 
  module, 
  onEdit, 
  onDelete, 
  onAddLesson,
  isDragging 
}: ModuleCardProps) {
  return (
    <Card className={isDragging ? 'opacity-50' : ''}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{module.name}</h3>
              {module.is_required && (
                <Badge variant="outline" className="text-xs">مطلوب</Badge>
              )}
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {module.description}
              </p>
            )}
            {module.estimated_minutes && (
              <p className="text-xs text-muted-foreground mt-2">
                المدة المقدرة: {module.estimated_minutes} دقيقة
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAddLesson && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onAddLesson(module.id)}
            >
              <Plus className="h-4 w-4 ml-1" />
              درس
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(module)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(module.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {module.lessons && module.lessons.length > 0 && (
          <div className="space-y-2">
            {module.lessons.map((lesson, index) => (
              <div 
                key={lesson.id}
                className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50"
              >
                <span className="text-muted-foreground">{index + 1}.</span>
                <span className="flex-1">{lesson.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {lesson.content_type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
