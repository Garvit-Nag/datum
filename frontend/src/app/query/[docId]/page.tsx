import { AuthGuard } from "@/shared/components/AuthGuard";
import { QueryPageClient } from "@/features/query/components/QueryPageClient";

type Props = {
  params: { docId: string };
};

export default function QueryPage({ params }: Props) {
  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <QueryPageClient docId={params.docId} docName="Contract Document" />
      </main>
    </AuthGuard>
  );
}
