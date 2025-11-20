import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { GripVertical, Edit, Trash2, FileText, Video, File } from 'lucide-react';
import type { Lesson } from '../../types';

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

const contentTypeIcons = {
  text: FileText,
  video: Video,
  pdf: File,
  scorm: File,
  interactive: FileText,
};

const contentTypeLabels = {
  text: 'نص',
  video: 'فيديو',
  pdf: 'PDF',
  scorm: 'SCORM',
  interactive: 'تفاعلي',
};

export function LessonCard({ 
  lesson, 
  index, 
  onEdit, 
  onDelete,
  isDragging 
}: LessonCardProps) {
  const Icon = contentTypeIcons[lesson.content_type];

  return (
    <Card className={isDragging ? 'opacity-50' : ''}>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{index}.</span>
            <h4 className="font-medium">{lesson.name}</h4>
            {lesson.is_required && (
              <Badge variant="outline" className="text-xs">مطلوب</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className="text-xs">
              {contentTypeLabels[lesson.content_type]}
            </Badge>
            {lesson.estimated_minutes && (
              <span className="text-xs text-muted-foreground">
                {lesson.estimated_minutes} دقيقة
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(lesson)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(lesson.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
