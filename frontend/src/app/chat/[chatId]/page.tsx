"use client";

import { useState, use, useEffect, useRef } from "react";
import { AuthGuard } from "@/shared/components/AuthGuard";
import { Navbar } from "@/shared/components/Navbar";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatMessageList } from "@/features/chat/components/ChatMessageList";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { ChatWelcome } from "@/features/chat/components/ChatWelcome";
import { NewChatDialog } from "@/features/chat/components/NewChatDialog";
import {
  useChatDetail,
  useChatMessages,
  useSendMessage,
  useUpdateChatTitle,
} from "@/features/chat/hooks/useChats";
import { useSupabaseSession } from "@/shared/providers/supabase-provider";
import { supabase } from "@/shared/lib/supabase";
import { FileText, ExternalLink, Loader2 } from "lucide-react";

type Props = {
  params: Promise<{ chatId: string }>;
};

export default function ChatPage({ params }: Props) {
  const { chatId } = use(params);
  const [newChatOpen, setNewChatOpen] = useState(false);

  return (
    <AuthGuard>
      <Navbar />
      <ChatPageContent
        chatId={chatId}
        newChatOpen={newChatOpen}
        setNewChatOpen={setNewChatOpen}
      />
    </AuthGuard>
  );
}

function ChatPageContent({
  chatId,
  newChatOpen,
  setNewChatOpen,
}: {
  chatId: string;
  newChatOpen: boolean;
  setNewChatOpen: (v: boolean) => void;
}) {
  const { user } = useSupabaseSession();
  const { data: chat, isLoading: chatLoading } = useChatDetail(chatId);
  const { data: messages, isLoading: msgsLoading } = useChatMessages(chatId);
  const { mutateAsync: sendMessage, isPending } = useSendMessage(
    chatId,
    chat?.document_id ?? "",
  );
  const { mutate: updateTitle } = useUpdateChatTitle();

  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const hasSentRef = useRef(false);
  const [hasSent, setHasSent] = useState(false);

  // PDF signed URL
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!chat?.document_id || !chat?.document_filename || !user?.id) return;
    const path = `${user.id}/${chat.document_id}/${chat.document_filename}`;
    supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setPdfUrl(data.signedUrl);
      })
      .catch(() => undefined);
  }, [chat?.document_id, chat?.document_filename, user?.id]);

  async function handleSend(question: string) {
    if (!chat) return;
    setSendError(null);
    if (!hasSentRef.current) {
      hasSentRef.current = true;
      setHasSent(true);
    }
    setPendingQuestion(question);
    try {
      await sendMessage(question);
      if ((messages?.length ?? 0) === 0) {
        const title = question.length > 60 ? question.slice(0, 57) + "…" : question;
        updateTitle({ chatId, title });
      }
    } catch (err: unknown) {
      const rawDetail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
        ?.detail;
      const detailMsg =
        typeof rawDetail === "string"
          ? rawDetail
          : typeof rawDetail === "object" && rawDetail !== null
            ? (rawDetail as { message?: string }).message ?? null
            : null;
      const baseMsg =
        detailMsg ??
        (err instanceof Error ? err.message : null) ??
        "Something went wrong. Please try again.";
      const msg =
        baseMsg.includes("429") || baseMsg.toLowerCase().includes("rate limit")
          ? "Rate limit reached — please wait a moment before sending another message."
          : baseMsg.includes("LLM_ERROR") || baseMsg.toLowerCase().includes("groq")
            ? "The AI service is temporarily unavailable. Please try again shortly."
            : baseMsg;
      setSendError(msg);
      setPendingQuestion(null);
    } finally {
      setPendingQuestion(null);
    }
  }

  if (chatLoading || msgsLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        <ChatSidebar activeChatId={chatId} onNewChat={() => setNewChatOpen(true)} />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      </div>
    );
  }

  const docFilename = chat?.document_filename ?? "Document";
  const isReady = (chat?.document_status ?? "") === "ready";
  const messageList = messages ?? [];
  const hasContent =
    messageList.length > 0 || pendingQuestion !== null || sendError !== null || hasSent;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <ChatSidebar activeChatId={chatId} onNewChat={() => setNewChatOpen(true)} />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Document header — clickable PDF pill */}
        <div className="flex items-center gap-3 border-b border-border/40 bg-background/60 px-6 py-3 backdrop-blur-sm">
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1.5 pl-2.5 pr-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-card/80"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                <FileText className="h-2.5 w-2.5 text-primary" />
              </span>
              <span className="max-w-[420px] truncate text-[12px] font-medium text-foreground/85 group-hover:text-foreground">
                {docFilename}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground/50 transition-colors group-hover:text-primary" />
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1.5 pl-2.5 pr-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/60">
                <FileText className="h-2.5 w-2.5 text-muted-foreground" />
              </span>
              <span className="max-w-[420px] truncate text-[12px] font-medium text-foreground/70">
                {docFilename}
              </span>
            </div>
          )}

          {!isReady && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10.5px] font-medium text-amber-500">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Processing
            </span>
          )}
        </div>

        {/* Messages or welcome */}
        {!hasContent ? (
          <ChatWelcome documentName={docFilename} />
        ) : (
          <ChatMessageList
            messages={messageList}
            pendingQuestion={pendingQuestion}
            errorMessage={sendError}
          />
        )}

        {/* Input */}
        {isReady ? (
          <ChatInput onSend={handleSend} isPending={isPending} />
        ) : (
          <div className="border-t border-border/40 bg-background/60 px-6 py-4 text-center text-[12px] text-muted-foreground backdrop-blur-sm">
            Document is still processing. This usually takes 15–30 seconds…
          </div>
        )}
      </main>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  );
}
