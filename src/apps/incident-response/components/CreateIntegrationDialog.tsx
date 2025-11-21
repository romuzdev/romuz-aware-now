/**
 * Create Integration Dialog - Simple Version
 */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateIntegrationDialog({ open, onOpenChange }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => onOpenChange(false)}>
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">إنشاء تكامل جديد</h2>
        <p className="text-muted-foreground mb-4">قيد التطوير - سيتم إضافة نموذج كامل قريباً</p>
        <button 
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
