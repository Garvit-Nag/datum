import { AdminGuard } from "@/shared/components/AdminGuard";
import { AppNav } from "@/shared/components/AppNav";
import { EvaluationPageClient } from "@/features/evaluation/components/EvaluationPageClient";

export default function EvaluationPage() {
  return (
    <AdminGuard>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <EvaluationPageClient />
      </main>
    </AdminGuard>
  );
}
