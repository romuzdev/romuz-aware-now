/**
 * Create Integration Dialog - Placeholder
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CreateIntegrationDialog({ open, onOpenChange }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء تكامل جديد</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">قيد التطوير</p>
      </DialogContent>
    </Dialog>
  );
}
