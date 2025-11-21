/**
 * M13.1 - Content Hub: Content Share Dialog
 * مربع حوار مشاركة المحتوى
 */

import { useState } from 'react';
import { Copy, Mail, Share2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { useToast } from '@/core/components/ui/use-toast';

interface ContentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentTitle: string;
  contentUrl: string;
  onShare?: (channel: string) => void;
}

const SHARE_CHANNELS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-500',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '𝕏',
    color: 'bg-black',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-600',
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    color: 'bg-gray-600',
    getUrl: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
];

export function ContentShareDialog({
  open,
  onOpenChange,
  contentTitle,
  contentUrl,
  onShare,
}: ContentShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(contentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ الرابط إلى الحافظة',
      });

      onShare?.('copy_link');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الرابط',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (channel: typeof SHARE_CHANNELS[0]) => {
    const url = channel.getUrl(contentUrl, contentTitle);
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.(channel.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            مشاركة المحتوى
          </DialogTitle>
          <DialogDescription>
            شارك هذا المحتوى مع الآخرين
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">رابط المحتوى</label>
            <div className="flex gap-2">
              <Input
                value={contentUrl}
                readOnly
                className="flex-1"
                dir="ltr"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">مشاركة عبر</label>
            <div className="grid grid-cols-2 gap-2">
              {SHARE_CHANNELS.map((channel) => (
                <Button
                  key={channel.id}
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => handleShare(channel)}
                >
                  <span className="text-xl">{channel.icon}</span>
                  <span>{channel.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
