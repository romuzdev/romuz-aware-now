/**
 * Enrollments List Component
 * 
 * Displays list of course enrollments with filtering
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Search, Trash2 } from 'lucide-react';
import { PermissionGate } from '../common/PermissionGate';

interface Enrollment {
  id: string;
  employee_ref: string;
  course_name: string;
  status: string;
  enrolled_at: string;
  progress_percent?: number;
}

interface EnrollmentsListProps {
  enrollments: Enrollment[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function EnrollmentsList({
  enrollments,
  onDelete,
  isLoading,
}: EnrollmentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEnrollments = enrollments.filter((enrollment) =>
    enrollment.employee_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.course_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      completed: 'secondary',
      suspended: 'destructive',
      expired: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading enrollments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Enrolled Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No enrollments found
                </TableCell>
              </TableRow>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {enrollment.employee_ref}
                  </TableCell>
                  <TableCell>{enrollment.course_name}</TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell>
                    {enrollment.progress_percent !== undefined
                      ? `${enrollment.progress_percent}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <PermissionGate permission="enrollments.delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(enrollment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
