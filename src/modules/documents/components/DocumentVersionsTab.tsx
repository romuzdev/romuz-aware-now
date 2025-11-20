/**
 * DocumentVersionsTab Component
 * 
 * Displays version history table with download/preview actions
 */

import { Button } from "@/core/components/ui/button";
import { Download, Eye, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getDocumentVersionDownloadUrl, triggerDownload } from "@/lib/documents/downloadUrls";
import { useState } from "react";
import { FilePreviewModal } from "./FilePreviewModal";

interface DocumentVersion {
  id: string;
  version_number: number;
  uploaded_by: string;
  uploaded_at: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  is_major: boolean;
  change_summary?: string;
  filename?: string;
}

interface DocumentVersionsTabProps {
  versions: DocumentVersion[];
  onUploadClick: () => void;
  canUpload: boolean;
}

export function DocumentVersionsTab({ 
  versions, 
  onUploadClick, 
  canUpload 
}: DocumentVersionsTabProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  }>({
    isOpen: false,
    fileUrl: "",
    fileName: "",
    mimeType: "",
  });

  const handleDownload = async (version: DocumentVersion) => {
    setDownloadingId(version.id);
    try {
      const url = await getDocumentVersionDownloadUrl(version.storage_path);
      const filename = version.filename || `version_${version.version_number}.${version.mime_type.split('/')[1] || 'pdf'}`;
      triggerDownload(url, filename);
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error.message || "Failed to download version");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (version: DocumentVersion) => {
    try {
      const url = await getDocumentVersionDownloadUrl(version.storage_path);
      const filename = version.filename || `version_${version.version_number}`;
      setPreviewModal({
        isOpen: true,
        fileUrl: url,
        fileName: filename,
        mimeType: version.mime_type,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load preview");
    }
  };

  const canPreview = (mimeType: string) => {
    return (
      mimeType === "application/pdf" ||
      mimeType.startsWith("image/")
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? 's' : ''} available
        </p>
        {canUpload && (
          <Button onClick={onUploadClick}>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Version
          </Button>
        )}
      </div>

      {versions.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium">No versions yet</p>
          <p className="text-sm mt-1">Upload the first version to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/70">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Version</th>
                <th className="px-4 py-3 font-semibold">Uploaded By</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Uploaded At</th>
                <th className="px-4 py-3 font-semibold">Changes</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-t hover:bg-muted/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">
                        v{version.version_number}
                      </span>
                      {version.is_major && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Major
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {version.uploaded_by}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFileSize(version.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(version.uploaded_at), "MMM dd, yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {version.change_summary || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canPreview(version.mime_type) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(version)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(version)}
                        disabled={downloadingId === version.id}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
        mimeType={previewModal.mimeType}
      />
    </div>
  );
}
