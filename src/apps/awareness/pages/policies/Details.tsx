import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/core/components/ui/button";
import { usePolicyById } from "@/modules/policies";
import { Pencil } from "lucide-react";
import { PolicyDeleteDialog } from "@/modules/policies";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { AIAdvisoryPanel } from "@/modules/ai-advisory/components";

export default function PolicyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const { data: policy, loading, error } = usePolicyById(id);

  const handleDeleteSuccess = () => {
    navigate("/platform/policies");
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify_between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Policy Details
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {policy?.title || "Policy"}
          </h1>
          {policy?.code && (
            <p className="text-sm text-muted-foreground">Code: {policy.code}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/platform/policies">
            <Button variant="outline" size="sm">
              Back to list
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/platform/policies/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          {policy && tenantId && (
            <PolicyDeleteDialog
              policy={policy}
              tenantId={tenantId}
              onDeleteSuccess={handleDeleteSuccess}
            />
          )}
        </div>
      </header>

      {loading && (
        <section className="border rounded-lg p-6 bg-background text-muted-foreground">
          <p className="text-sm">Loading policy details…</p>
        </section>
      )}

      {error && (
        <section className="border rounded-lg p-6 bg-destructive/10 text-destructive">
          <p className="text-sm">Failed to load policy details: {error}</p>
        </section>
      )}

      {!loading && !error && !policy && (
        <section className="border rounded-lg p-6 bg-background text-muted-foreground">
          <p className="text-sm">Policy not found.</p>
        </section>
      )}

      {!loading && !error && policy && (
        <>
          <section className="border rounded-lg bg-background p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Owner
                </p>
                <p className="text-sm">{policy.owner || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Status
                </p>
                <p className="text-sm">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {policy.status}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Category
                </p>
                <p className="text-sm">{policy.category || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Last review
                </p>
                <p className="text-sm">{policy.last_review_date || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Next review
                </p>
                <p className="text-sm">{policy.next_review_date || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Last updated
                </p>
                <p className="text-sm">{policy.updated_at || "-"}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-xs text-muted-foreground uppercase mb-1">
                Notes / TODO
              </p>
              <p className="text-sm text-muted-foreground">
                This is a read-only view backed by Supabase.
                Change history and audit logging will be implemented
                in the next phases.
              </p>
            </div>
          </section>

          <AIAdvisoryPanel
            contextType="policy"
            contextId={policy.id}
            contextData={{
              code: policy.code,
              title: policy.title,
              category: policy.category,
              status: policy.status,
              owner: policy.owner,
            }}
            title="توصيات ذكية لهذه السياسة"
            description="احصل على توصيات مدعومة بالذكاء الاصطناعي لتحسين هذه السياسة وزيادة فعاليتها"
          />
        </>
      )}

      {/* TODO D2-Part6:
        - Add sections for: description, scope, related frameworks, related risks.
        - Wire "Edit Policy" to an edit form or drawer.
        - Integrate Audit Log to show last changes for this policy.
      */}
    </div>
  );
}
