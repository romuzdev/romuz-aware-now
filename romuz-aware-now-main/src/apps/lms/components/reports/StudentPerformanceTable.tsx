/**
 * Student Performance Table Component
 * 
 * Displays detailed student performance data in a table
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Button } from '@/core/components/ui/button';
import { Download } from 'lucide-react';

interface StudentPerformance {
  id: string;
  studentName: string;
  enrollmentDate: string;
  progress: number;
  lastAccessed?: string;
  assessmentScore?: number;
  status: 'active' | 'completed' | 'suspended';
}

interface StudentPerformanceTableProps {
  students: StudentPerformance[];
  onExport?: () => void;
}

export function StudentPerformanceTable({
  students,
  onExport,
}: StudentPerformanceTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'secondary',
      completed: 'default',
      suspended: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {onExport && (
        <div className="flex justify-end">
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Enrollment Date</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Assessment Score</TableHead>
              <TableHead>Last Accessed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No student data available
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.studentName}
                  </TableCell>
                  <TableCell>
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={student.progress} className="h-2 w-20" />
                      <span className="text-sm">{student.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.assessmentScore !== undefined
                      ? `${student.assessmentScore}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {student.lastAccessed
                      ? new Date(student.lastAccessed).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
