/**
 * Integration Details Dialog - Simple Version
 */

interface Props {
  integration: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationDetailsDialog({ integration, open, onOpenChange }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => onOpenChange(false)}>
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">تفاصيل التكامل</h2>
        <div className="space-y-4">
          <div>
            <span className="font-semibold">الاسم:</span> {integration?.integration_name}
          </div>
          <div>
            <span className="font-semibold">النوع:</span> {integration?.integration_type}
          </div>
          <div>
            <span className="font-semibold">المزود:</span> {integration?.provider}
          </div>
          <div>
            <span className="font-semibold">الحالة:</span> {integration?.is_active ? 'نشط' : 'معطل'}
          </div>
          <div>
            <span className="font-semibold">الأحداث المستلمة:</span> {integration?.total_events_received}
          </div>
        </div>
        <button 
          onClick={() => onOpenChange(false)}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
