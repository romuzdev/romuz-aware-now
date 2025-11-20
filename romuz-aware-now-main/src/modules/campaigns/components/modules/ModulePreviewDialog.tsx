import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Separator } from '@/core/components/ui/separator';
import { ExternalLink } from 'lucide-react';
import { QuizEditorPanel } from './QuizEditorPanel';
import type { Module } from '@/modules/campaigns';

interface Props {
  open: boolean;
  onClose: () => void;
  module: Module | null;
  onTestRunQuiz?: (moduleId: string) => void;
}

export function ModulePreviewDialog({ open, onClose, module, onTestRunQuiz }: Props) {
  if (!module) return null;

  const renderContent = () => {
    switch (module.type) {
      case 'article':
        return (
          <div className="prose prose-sm max-w-none">
            {module.content ? (
              <div className="whitespace-pre-wrap">{module.content}</div>
            ) : (
              <p className="text-muted-foreground">No content available</p>
            )}
          </div>
        );

      case 'video':
        return module.urlOrRef ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Video URL:</p>
            <a
              href={module.urlOrRef}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {module.urlOrRef}
              <ExternalLink className="w-4 h-4" />
            </a>
            {module.urlOrRef.includes('youtube.com') || module.urlOrRef.includes('youtu.be') ? (
              <div className="aspect-video">
                <iframe
                  src={module.urlOrRef.replace('watch?v=', 'embed/')}
                  className="w-full h-full rounded"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">No video URL provided</p>
        );

      case 'link':
        return module.urlOrRef ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">External Link:</p>
            <a
              href={module.urlOrRef}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {module.urlOrRef}
              <ExternalLink className="w-4 h-4" />
            </a>
            <Button asChild className="mt-4">
              <a href={module.urlOrRef} target="_blank" rel="noopener noreferrer">
                Open Link
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">No link provided</p>
        );

      case 'file':
        return module.urlOrRef ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">File Reference:</p>
            <p className="font-mono text-sm bg-muted p-2 rounded">{module.urlOrRef}</p>
            <Button asChild>
              <a href={module.urlOrRef} target="_blank" rel="noopener noreferrer">
                Download File
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">No file reference provided</p>
        );

      default:
        return <p className="text-muted-foreground">Unknown module type</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Type: {module.type}</span>
            {module.estimatedMinutes && <span>• {module.estimatedMinutes} min</span>}
            <span>• {module.isRequired ? 'Required' : 'Optional'}</span>
          </div>

          <div className="border-t pt-4">{renderContent()}</div>

          {/* Quiz Editor Panel */}
          <Separator />
          <QuizEditorPanel
            moduleId={module.id}
            onTestRun={onTestRunQuiz ? () => onTestRunQuiz(module.id) : undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
