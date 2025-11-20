/**
 * Documents Hub - List Page
 * 
 * Main page for viewing and managing organizational documents
 * Part 7.1 — Gate-G Documents & Attachments Hub v1
 */

import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Checkbox } from "@/core/components/ui/checkbox";
import { useDocuments } from "@/modules/documents";
import { useNavigate } from "react-router-dom";
import { 
  DocumentsFilters,
  DocumentStatusBadge,
  DocumentTypeBadge,
  CreateDocumentModal,
  DocumentsBulkActionsToolbar
} from "@/modules/documents";
import type { DocumentFilters } from "@/modules/documents";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Eye, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRBAC } from "@/core/rbac";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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
import { deleteDocument } from "@/core/services";

export default function DocumentsAdmin() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DocumentFilters>({
    search: "",
    doc_type: "",
    status: "",
    date_from: undefined,
    date_to: undefined,
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const { documents, total, loading, error, refetch } = useDocuments(filters);
  
  // Check RBAC permissions
  const { can: canCreate } = useRBAC("documents.create");
  const { can: canDelete } = useRBAC("documents.delete");

  const handleFiltersChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
  };

  const handleCreateDocument = () => {
    setCreateModalOpen(true);
  };

  const handleDocumentCreated = (documentId: string) => {
    refetch();
    navigate(`/admin/documents/${documentId}`);
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/admin/documents/${documentId}`);
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocument(documentToDelete, true); // cascade delete versions & attachments
      toast.success("Document deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Actions Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(documents.map((doc) => doc.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    const newSelection = new Set(selectedDocuments);
    if (checked) {
      newSelection.add(documentId);
    } else {
      newSelection.delete(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedDocuments);
    for (const id of idsToDelete) {
      await deleteDocument(id, true);
    }
    refetch();
  };

  const handleBulkStatusChange = async (status: string) => {
    const idsToUpdate = Array.from(selectedDocuments);
    await supabase
      .from("documents")
      .update({ status })
      .in("id", idsToUpdate);
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all organizational documents and their versions
          </p>
        </div>
        {canCreate && (
          <Button variant="default" onClick={handleCreateDocument}>
            <FileText className="h-4 w-4 mr-2" />
            New Document
          </Button>
        )}
      </header>

      {/* Filters */}
      <DocumentsFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 bg-destructive/10 text-destructive">
            <p className="text-sm">Failed to load documents: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents Table (Desktop) & Cards (Mobile) */}
      {!loading && !error && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {documents.length} of {total} documents
            </p>
          </div>

          {/* Desktop Table View (min-width: 1024px) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/70">
                <tr className="text-left">
                  <th className="px-4 py-3 w-12">
                    <Checkbox
                      checked={
                        documents.length > 0 &&
                        documents.every((doc) => selectedDocuments.has(doc.id))
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last Version</th>
                  <th className="px-4 py-3 font-semibold">Updated At</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-base font-medium">No documents found</p>
                      <p className="text-sm mt-1">
                        {filters.search || filters.doc_type || filters.status
                          ? "Try adjusting your filters"
                          : "Create your first document to get started"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-t hover:bg-muted/60"
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDocuments.has(doc.id)}
                          onCheckedChange={(checked) =>
                            handleSelectDocument(doc.id, checked as boolean)
                          }
                          aria-label={`Select ${doc.title}`}
                        />
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        <div>
                          <p className="font-medium text-foreground">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap cursor-pointer"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        <DocumentTypeBadge type={doc.doc_type as any} />
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap cursor-pointer"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        <DocumentStatusBadge status={doc.status as any} />
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap text-muted-foreground cursor-pointer"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        {doc.current_version_id ? (
                          <span className="text-foreground font-mono text-xs">Latest</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap text-muted-foreground cursor-pointer"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        {format(new Date(doc.updated_at), "MMM dd, yyyy")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View (below 1024px) */}
          <div className="lg:hidden p-4 space-y-4">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-base font-medium">No documents found</p>
                <p className="text-sm mt-1">
                  {filters.search || filters.doc_type || filters.status
                    ? "Try adjusting your filters"
                    : "Create your first document to get started"}
                </p>
              </div>
            ) : (
              documents.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <DocumentTypeBadge type={doc.doc_type as any} />
                      <DocumentStatusBadge status={doc.status as any} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated: {format(new Date(doc.updated_at), "MMM dd, yyyy")}</span>
                      {doc.current_version_id && (
                        <span className="font-mono">Latest</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Optional: Load More / Pagination */}
          {documents.length < total && (
            <div className="p-4 border-t flex items-center justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Load More
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleDocumentCreated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This will also delete all versions and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions Toolbar */}
      <DocumentsBulkActionsToolbar
        selectedCount={selectedDocuments.size}
        onClearSelection={() => setSelectedDocuments(new Set())}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
      />
    </div>
  );
}
