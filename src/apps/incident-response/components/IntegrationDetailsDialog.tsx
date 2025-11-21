/**
 * Integration Details Dialog - Placeholder
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function IntegrationDetailsDialog({ integration, open, onOpenChange }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تفاصيل التكامل</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">قيد التطوير</p>
      </DialogContent>
    </Dialog>
  );
}
