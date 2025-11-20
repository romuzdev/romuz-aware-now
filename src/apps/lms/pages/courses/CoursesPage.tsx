import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { CourseList, CourseFilters } from '@/modules/training/components';
import { useCourses } from '@/modules/training/hooks';
import type { CourseFilters as Filters } from '@/modules/training/types';
import { useNavigate } from 'react-router-dom';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const { data: courses, isLoading } = useCourses(filters);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الدورات التدريبية</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وتنظيم الدورات التدريبية
          </p>
        </div>
        <Button onClick={() => navigate('/lms/courses/new')}>
          <Plus className="ml-2 h-4 w-4" />
          دورة جديدة
        </Button>
      </div>

      <CourseFilters filters={filters} onFiltersChange={setFilters} />

      <CourseList courses={courses || []} isLoading={isLoading} />
    </div>
  );
}
