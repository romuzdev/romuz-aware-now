/**
 * M23 - Recovery Test Runner Component
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { toast } from 'sonner';
import { executeRecoveryTest } from '@/integrations/supabase/disaster-recovery';

export function RecoveryTestRunner() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);

  async function runTest() {
    setRunning(true);
    try {
      await executeRecoveryTest({
        test_name: 'Manual Recovery Test',
        test_type: 'manual',
        validation_level: 'full',
      });
      toast.success(t('backup.test.started'));
    } catch (error: any) {
      toast.error(t('backup.test.error'), { description: error.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('backup.test.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('backup.test.description')}</p>
        </div>
        <Button onClick={runTest} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          {t('backup.test.run')}
        </Button>
      </div>
    </Card>
  );
}
