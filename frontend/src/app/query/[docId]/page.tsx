"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useCreateChat } from "@/features/chat/hooks/useChats";
import { AuthGuard } from "@/shared/components/AuthGuard";

type Props = {
  params: Promise<{ docId: string }>;
};

/**
 * Legacy /query/[docId] route — automatically creates a new chat
 * for the specified document and redirects to the chat page.
 */
export default function QueryRedirectPage({ params }: Props) {
  const { docId } = use(params);
  const router = useRouter();
  const { mutateAsync: createChat, isPending } = useCreateChat();

  useEffect(() => {
    if (!docId) return;
    createChat({ document_id: docId })
      .then((chat) => {
        router.replace(`/chat/${chat.id}`);
      })
      .catch(() => {
        router.replace("/dashboard");
      });
  }, [docId, createChat, router]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">
            Creating chat session…
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
