import { AuthGuard } from "@/shared/components/AuthGuard";
import { DocumentUploadForm } from "@/features/document/components/DocumentUploadForm";
import { DocumentList } from "@/features/document/components/DocumentList";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Your Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload an MSA contract to start asking questions about it.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <DocumentUploadForm />
        </div>
        <DocumentList />
      </main>
    </AuthGuard>
  );
}
