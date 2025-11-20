/**
 * Document Details Page
 * 
 * Complete detail view for a single document
 * Part 7.2 — Gate-G Documents & Attachments Hub v1
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useDocumentById } from "@/modules/documents";
import { useAttachments } from "@/core/hooks/utils/useAttachments";
import { useRBAC } from "@/core/rbac";
import { 
  DocumentStatusBadge,
  DocumentTypeBadge,
  DocumentVersionsTab,
  DocumentAttachmentsTab,
  UploadVersionModal,
  UploadAttachmentModal,
  DocumentVersionHistory,
  VersionCompare,
  DocumentOCR
} from "@/modules/documents";
import { ArrowLeft, Upload, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteDocument } from "@/core/services";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadVersionModalOpen, setUploadVersionModalOpen] = useState(false);
  const [uploadAttachmentModalOpen, setUploadAttachmentModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // M10: Version Compare State
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareVersionIds, setCompareVersionIds] = useState<{ v1: string; v2: string } | null>(null);

  // Guard: Redirect if no valid ID
  if (!id || id === ":id") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 bg-destructive/10 text-destructive">
            <p className="text-sm">Invalid document ID</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/platform/documents")}>
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch document data
  const { document, loading: docLoading, error: docError, refetch: refetchDocument } = useDocumentById(id);

  // Fetch attachments
  const { 
    attachments, 
    loading: attachmentsLoading, 
    refetch: refetchAttachments 
  } = useAttachments({
    linked_module: "document",
    linked_entity_id: id,
  });

  // RBAC permissions
  const { can: canUpload } = useRBAC("documents.create");
  const { can: canManage } = useRBAC("documents.manage");
  const { can: canDelete } = useRBAC("documents.delete");

  const handleBack = () => {
    navigate("/platform/documents");
  };

  const handleUploadVersion = () => {
    setUploadVersionModalOpen(true);
  };

  const handleVersionUploaded = () => {
    refetchDocument();
  };

  const handleUploadAttachment = () => {
    setUploadAttachmentModalOpen(true);
  };

  const handleAttachmentUploaded = () => {
    refetchAttachments();
  };

  const handleDeleteDocument = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteDocument(id, true); // cascade delete
      toast.success("Document deleted successfully");
      navigate("/platform/documents");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
      setIsDeleting(false);
    }
  };

  // M10: Version Compare Handler
  const handleVersionCompare = (version1Id: string, version2Id: string) => {
    setCompareVersionIds({ v1: version1Id, v2: version2Id });
    setCompareModalOpen(true);
  };

  // Loading state
  if (docLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (docError || !document) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 bg-destructive/10 text-destructive">
            <p className="text-sm">{docError || "Document not found"}</p>
            <Button variant="outline" className="mt-4" onClick={handleBack}>
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Documents Hub
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">{document.title}</h1>
            <div className="flex items-center gap-2">
              <DocumentTypeBadge type={document.doc_type as any} />
              <DocumentStatusBadge status={document.status as any} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canUpload && (
              <Button variant="outline" onClick={handleUploadVersion}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Version
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="outline" 
                onClick={handleDeleteDocument}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">
            Versions ({document.versions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="version-history">
            Version History
          </TabsTrigger>
          <TabsTrigger value="ocr">
            OCR Extraction
          </TabsTrigger>
          <TabsTrigger value="attachments">
            Attachments ({attachments.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document Information</CardTitle>
              {canManage && (
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              {document.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm text-foreground mt-1">{document.description}</p>
                </div>
              )}

              {/* Linked Module */}
              {document.linked_module && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Linked Module</label>
                  <p className="text-sm text-foreground mt-1">{document.linked_module}</p>
                </div>
              )}

              {/* Linked Entity ID */}
              {document.linked_entity_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Linked Entity ID</label>
                  <p className="text-sm text-foreground font-mono mt-1">{document.linked_entity_id}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="text-sm text-foreground mt-1">{document.created_by}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm text-foreground mt-1">
                    {format(new Date(document.updated_at), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Document ID</label>
                  <p className="text-sm text-foreground font-mono mt-1">{document.id}</p>
                </div>
                {document.current_version_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Version</label>
                    <p className="text-sm text-foreground font-mono mt-1">
                      {document.current_version_id}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions">
          <Card>
            <CardContent className="p-6">
              <DocumentVersionsTab
                versions={document.versions || []}
                onUploadClick={handleUploadVersion}
                canUpload={canUpload}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* M10: Version History Tab */}
        <TabsContent value="version-history">
          <DocumentVersionHistory
            documentId={id}
            onCompare={handleVersionCompare}
          />
        </TabsContent>

        {/* M10: OCR Extraction Tab */}
        <TabsContent value="ocr">
          {document.current_version_id && document.versions && document.versions.length > 0 ? (
            <DocumentOCR
              documentId={id}
              storagePath={document.versions[0].storage_path}
              mimeType={document.versions[0].mime_type}
            />
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <p>No document version available for OCR extraction.</p>
                <p className="text-sm mt-2">Please upload a document version first.</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <Card>
            <CardContent className="p-6">
              {attachmentsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <DocumentAttachmentsTab
                  attachments={attachments}
                  onUploadClick={handleUploadAttachment}
                  onRefresh={refetchAttachments}
                  canUpload={canUpload}
                  canDelete={canDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Version Modal */}
      <UploadVersionModal
        documentId={id!}
        currentVersion={document.versions?.length || 0}
        isOpen={uploadVersionModalOpen}
        onClose={() => setUploadVersionModalOpen(false)}
        onUploaded={handleVersionUploaded}
      />

      {/* Upload Attachment Modal */}
      <UploadAttachmentModal
        linked_entity_id={id!}
        isOpen={uploadAttachmentModalOpen}
        onClose={() => setUploadAttachmentModalOpen(false)}
        onUploaded={handleAttachmentUploaded}
      />

      {/* M10: Version Compare Modal */}
      {compareVersionIds && (
        <AlertDialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
          <AlertDialogContent className="max-w-5xl">
            <AlertDialogHeader>
              <AlertDialogTitle>مقارنة الإصدارات</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              <VersionCompare
                version1Id={compareVersionIds.v1}
                version2Id={compareVersionIds.v2}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCompareVersionIds(null)}>
                إغلاق
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This will also delete all versions and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
