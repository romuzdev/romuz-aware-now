/**
 * Auditors Page
 * M12: Manage internal and external auditors
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Users, Award, FileCheck } from 'lucide-react';

export default function Auditors() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">المدققون</h1>
        <p className="text-muted-foreground">
          إدارة المدققين الداخليين والخارجيين
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <CardTitle>إدارة المدققين</CardTitle>
          </div>
          <CardDescription>
            ميزة قيد التطوير
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">إدارة شهادات المدققين</p>
                  <p className="text-sm text-muted-foreground">
                    تتبع شهادات ومؤهلات المدققين
                  </p>
                </div>
                <Badge className="mr-auto">قريباً</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">تعيين المدققين</p>
                  <p className="text-sm text-muted-foreground">
                    تعيين المدققين لعمليات التدقيق المختلفة
                  </p>
                </div>
                <Badge className="mr-auto">قريباً</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">فرق التدقيق</p>
                  <p className="text-sm text-muted-foreground">
                    تنظيم المدققين في فرق عمل
                  </p>
                </div>
                <Badge className="mr-auto">قريباً</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
