import { AuthGuard } from "@/shared/components/AuthGuard";
import { AppNav } from "@/shared/components/AppNav";
import { QueryPageClient } from "@/features/query/components/QueryPageClient";

type Props = {
  params: Promise<{ docId: string }>;
};

export default async function QueryPage({ params }: Props) {
  const { docId } = await params;
  return (
    <AuthGuard>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <QueryPageClient docId={docId} docName="Contract Document" />
      </main>
    </AuthGuard>
  );
}
