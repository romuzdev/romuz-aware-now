import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import { upsertParticipant } from '@/modules/campaigns/integration';
import type { ParticipantCSVRow, ParticipantImportResult } from '@/modules/campaigns';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  onSuccess: () => void;
}

const VALID_STATUSES = ['not_started', 'in_progress', 'completed'];

export function ParticipantsImportDialog({ open, onClose, campaignId, onSuccess }: Props) {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ rows: ParticipantCSVRow[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    parseCSV(f);
  }

  function parseCSV(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        toast({ variant: 'destructive', title: 'Empty file' });
        return;
      }

      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const rows: ParticipantCSVRow[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        if (!row.employee_ref) {
          errors.push(`Row ${i + 1}: employee_ref is required`);
        }
        if (row.status && !VALID_STATUSES.includes(row.status)) {
          errors.push(`Row ${i + 1}: invalid status "${row.status}"`);
        }
        if (row.score && (isNaN(Number(row.score)) || Number(row.score) < 0 || Number(row.score) > 100)) {
          errors.push(`Row ${i + 1}: score must be 0-100`);
        }

        rows.push(row as ParticipantCSVRow);
      }

      setPreview({ rows, errors });
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!tenantId || !preview) return;
    setImporting(true);

    const result: ParticipantImportResult = { imported: 0, updated: 0, errors: [] };

    for (let i = 0; i < preview.rows.length; i++) {
      const row = preview.rows[i];
      if (!row.employee_ref) continue;

      try {
        const res = await upsertParticipant(tenantId, {
          campaignId,
          employeeRef: row.employee_ref,
          status: row.status as any,
          score: row.score ? Number(row.score) : null,
          completedAt: row.completed_at || null,
          notes: row.notes || null,
        });

        if (res.action === 'inserted') result.imported++;
        else result.updated++;
      } catch (e: any) {
        result.errors.push({ row: i + 2, message: e.message });
      }
    }

    setImporting(false);
    toast({
      title: 'Import complete',
      description: `Imported: ${result.imported}, Updated: ${result.updated}, Errors: ${result.errors.length}`,
    });

    if (result.errors.length === 0) {
      onSuccess();
      onClose();
      setFile(null);
      setPreview(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Participants (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p><strong>CSV Format:</strong> employee_ref, status, score, completed_at, notes</p>
            <p className="mt-1">
              <strong>Status:</strong> not_started | in_progress | completed (optional)
            </p>
            <p><strong>Score:</strong> 0-100 (optional)</p>
            <p><strong>Completed At:</strong> ISO date (optional)</p>
          </div>

          <Input type="file" accept=".csv" onChange={handleFileChange} />

          {preview && (
            <div className="border rounded p-3 space-y-2 max-h-60 overflow-y-auto">
              <div className="font-medium text-sm">
                Preview: {preview.rows.length} row(s)
              </div>
              {preview.errors.length > 0 && (
                <div className="text-sm text-destructive space-y-1">
                  {preview.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || preview.errors.length > 0 || importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
