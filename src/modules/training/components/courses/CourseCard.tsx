import { Card, CardContent, CardFooter, CardHeader } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { BookOpen, Clock, Users } from 'lucide-react';
import type { Course } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: Course;
}

const statusColors = {
  draft: 'bg-secondary',
  published: 'bg-primary',
  archived: 'bg-muted',
};

const levelLabels = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        {course.thumbnail_url && (
          <div className="w-full h-40 mb-4 rounded-md overflow-hidden bg-muted">
            <img 
              src={course.thumbnail_url} 
              alt={course.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">{course.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{course.code}</p>
          </div>
          <Badge className={statusColors[course.status]}>
            {course.status === 'draft' ? 'مسودة' : 
             course.status === 'published' ? 'منشور' : 'مؤرشف'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {course.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration_hours} ساعة</span>
          </div>
          
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{levelLabels[course.level]}</span>
          </div>
          
          {course.enrollmentCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.enrollmentCount}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate(`/lms/courses/${course.id}`)}
        >
          عرض التفاصيل
        </Button>
      </CardFooter>
    </Card>
  );
}
