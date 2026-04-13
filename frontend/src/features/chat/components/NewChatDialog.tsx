"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUploadDocument } from "@/features/document/hooks/useDocuments";
import { useCreateChat } from "@/features/chat/hooks/useChats";
import { fetchDocuments } from "@/features/document/services/document-service";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, CheckCircle } from "lucide-react";

type Stage = "idle" | "uploading" | "processing" | "ready" | "error";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewChatDialog({ open, onClose }: Props) {
  const router = useRouter();
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: uploadDoc } = useUploadDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function pollUntilReady(docId: string, chatId: string) {
    const MAX_POLLS = 60;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const docs = await fetchDocuments();
        const doc = docs.find((d) => d.id === docId);
        if (!doc) continue;
        if (doc.status === "ready") {
          setStage("ready");
          await new Promise((r) => setTimeout(r, 800));
          router.push(`/chat/${chatId}`);
          return;
        }
        if (doc.status === "failed") {
          setStage("error");
          setError("Document processing failed. Please try a different file.");
          return;
        }
      } catch {
        // network blip — keep polling
      }
    }
    setStage("error");
    setError("Processing is taking too long. Please try again.");
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setError(null);
    try {
      setStage("uploading");
      const doc = await uploadDoc(selectedFile);
      const chat = await createChat({
        document_id: doc.id,
        title: selectedFile.name.replace(/\.pdf$/i, ""),
      });
      setStage("processing");
      await pollUntilReady(doc.id, chat.id);
    } catch {
      setStage("error");
      setError("Something went wrong. Please try again.");
    }
  }

  const isBusy = stage === "uploading" || stage === "processing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={isBusy ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">New Chat</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF to start a conversation about it.
        </p>

        {/* Processing state */}
        {(stage === "processing" || stage === "ready") && (
          <div className="mt-6 flex flex-col items-center gap-3 py-4">
            {stage === "ready" ? (
              <CheckCircle className="h-10 w-10 text-green-500" />
            ) : (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
            <p className="text-sm font-medium text-foreground">
              {stage === "ready" ? "Ready! Opening chat…" : "Processing document…"}
            </p>
            <p className="text-xs text-muted-foreground">
              {stage === "ready"
                ? ""
                : "This may take a moment. Please don't close this window."}
            </p>
          </div>
        )}

        {/* Upload state */}
        {(stage === "idle" || stage === "uploading" || stage === "error") && (
          <>
            <label
              className={`mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-8 transition-colors ${
                isBusy ? "pointer-events-none opacity-50" : "hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              {stage === "uploading" ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Uploading…</span>
                </>
              ) : selectedFile ? (
                <>
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">Click to change file</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select a PDF</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                disabled={isBusy}
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] ?? null);
                  setError(null);
                  setStage("idle");
                }}
              />
            </label>

            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isBusy}
              className="mt-4 w-full"
            >
              {stage === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Upload & Start Chat"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isBusy}
              className="mt-2 w-full"
              size="sm"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
