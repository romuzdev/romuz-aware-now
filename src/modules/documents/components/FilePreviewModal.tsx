/**
 * FilePreviewModal Component
 * 
 * Modal for previewing document files (PDF, images) directly in the browser
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Download, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Skeleton } from "@/core/components/ui/skeleton";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  mimeType,
}: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isPDF = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isImage = mimeType.startsWith("image/") || 
                  /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setZoom(100);
      setRotation(0);
      setImageError(false);
    }
  }, [isOpen, fileUrl]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const renderPreview = () => {
    if (isPDF) {
      return (
        <div className="relative w-full h-[70vh] bg-muted/30 rounded-lg overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setImageError(true);
            }}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="relative w-full max-h-[70vh] bg-muted/30 rounded-lg overflow-auto flex items-center justify-center p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-64 h-64" />
            </div>
          )}
          {imageError ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Failed to load image</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="mt-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Download to view
              </Button>
            </div>
          ) : (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full h-auto transition-transform"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setImageError(true);
              }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm mb-4">Preview not available for this file type</p>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download to view
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{fileName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mimeType || "Unknown type"}
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        {isImage && !imageError && (
          <div className="flex items-center justify-center gap-2 pb-2 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isPDF && (
          <div className="flex items-center justify-end gap-2 pb-2 border-b">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}

        {/* Preview Content */}
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
}
