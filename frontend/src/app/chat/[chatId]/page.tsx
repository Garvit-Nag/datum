"use client";

import { useState, use } from "react";
import { AuthGuard } from "@/shared/components/AuthGuard";
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

type Props = {
  params: Promise<{ chatId: string }>;
};

export default function ChatPage({ params }: Props) {
  const { chatId } = use(params);
  const [newChatOpen, setNewChatOpen] = useState(false);

  return (
    <AuthGuard>
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
  const { data: chat, isLoading: chatLoading } = useChatDetail(chatId);
  const { data: messages, isLoading: msgsLoading } = useChatMessages(chatId);
  const { mutateAsync: sendMessage, isPending } = useSendMessage(
    chatId,
    chat?.document_id ?? ""
  );
  const { mutate: updateTitle } = useUpdateChatTitle();

  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend(question: string) {
    if (!chat) return;
    setSendError(null);
    setPendingQuestion(question);
    try {
      await sendMessage(question);
      if ((messages?.length ?? 0) === 0) {
        const title = question.length > 60 ? question.slice(0, 57) + "…" : question;
        updateTitle({ chatId, title });
      }
    } catch (err: unknown) {
      const rawDetail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
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
    } finally {
      setPendingQuestion(null);
    }
  }

  if (chatLoading || msgsLoading) {
    return (
      <div className="flex h-screen">
        <ChatSidebar activeChatId={chatId} onNewChat={() => setNewChatOpen(true)} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      </div>
    );
  }

  const docFilename = chat?.document_filename ?? "Document";
  const isReady = (chat?.document_status ?? "") === "ready";
  const messageList = messages ?? [];
  const hasContent = messageList.length > 0 || pendingQuestion !== null || sendError !== null;

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar activeChatId={chatId} onNewChat={() => setNewChatOpen(true)} />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <h1 className="min-w-0 truncate text-sm font-medium text-foreground">
            {chat?.title ?? "Chat"}
          </h1>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {docFilename}
          </span>
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
          <div className="border-t border-border/50 p-4 text-center text-sm text-muted-foreground">
            Document is still processing. Please wait…
          </div>
        )}
      </main>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  );
}
