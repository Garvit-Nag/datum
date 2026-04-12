import { AdminGuard } from "@/shared/components/AdminGuard";
import { EvaluationPageClient } from "@/features/evaluation/components/EvaluationPageClient";

export default function EvaluationPage() {
  return (
    <AdminGuard>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <EvaluationPageClient />
      </main>
    </AdminGuard>
  );
}
