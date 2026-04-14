import { AuthGuard } from "@/shared/components/AuthGuard";
import { Navbar } from "@/shared/components/Navbar";
import { EvaluationPageClient } from "@/features/evaluation/components/EvaluationPageClient";

export default function EvaluationPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="bg-grid-fade relative min-h-[calc(100vh-3.5rem)]">
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-10">
          <EvaluationPageClient />
        </div>
      </main>
    </AuthGuard>
  );
}
