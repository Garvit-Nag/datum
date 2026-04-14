"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import { useUploadDocument, useDocuments } from "@/features/document/hooks/useDocuments";
import { useCreateChat } from "@/features/chat/hooks/useChats";
import { fetchDocuments } from "@/features/document/services/document-service";
import type { DocumentType } from "@/features/document/types";

type Stage = "picker" | "upload" | "uploading" | "processing" | "ready" | "error";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewChatDialog({ open, onClose }: Props) {
  const router = useRouter();
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: uploadDoc } = useUploadDocument();
  const { data: existingDocs, isLoading: docsLoading } = useDocuments();

  const [stage, setStage] = useState<Stage>("picker");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Defer to allow exit animations
      const t = setTimeout(() => {
        setStage("picker");
        setSelectedFile(null);
        setError(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stage]);

  if (!open) return null;

  const isBusy =
    stage === "uploading" || stage === "processing" || stage === "ready";

  function handleClose() {
    if (isBusy) return;
    onClose();
  }

  function handleBackdropClick() {
    if (isBusy) return;
    handleClose();
  }

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
          await new Promise((r) => setTimeout(r, 600));
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

  async function handlePickExistingDoc(doc: DocumentType) {
    setError(null);
    try {
      const chat = await createChat({
        document_id: doc.id,
        title: doc.filename.replace(/\.pdf$/i, ""),
      });
      router.push(`/chat/${chat.id}`);
    } catch {
      setError("Could not create chat. Please try again.");
    }
  }

  const readyDocs = (existingDocs ?? []).filter((d) => d.status === "ready");
  const hasReadyDocs = readyDocs.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            {stage === "upload" && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  setStage("picker");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
                {stage === "upload" ? "Upload PDF" : "New Chat"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {stage === "upload"
                  ? "Drop in an MSA contract PDF"
                  : "Choose an existing document or upload a new one"}
              </p>
            </div>
          </div>
          {!isBusy && (
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* PROCESSING / READY */}
          {(stage === "processing" || stage === "ready") && (
            <div className="flex flex-col items-center gap-4 py-7">
              {stage === "ready" ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              <div className="text-center">
                <p className="text-[13px] font-semibold text-foreground">
                  {stage === "ready" ? "Ready! Opening chat…" : "Processing document…"}
                </p>
                {stage === "processing" && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Embedding chunks · indexing vectors · 15–30s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PICKER — list existing docs + upload option */}
          {stage === "picker" && (
            <div className="space-y-2">
              {docsLoading ? (
                <>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-11 animate-pulse rounded-xl bg-muted/40"
                    />
                  ))}
                </>
              ) : hasReadyDocs ? (
                <>
                  <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                    {readyDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handlePickExistingDoc(doc)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-2.5 text-left transition-all duration-150 hover:-translate-y-px hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-primary/10">
                          <FileText className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground/85 group-hover:text-foreground">
                          {doc.filename}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="my-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                      or
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                </>
              ) : null}

              <button
                onClick={() => setStage("upload")}
                className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/20 px-3.5 py-3 text-left transition-all duration-150 hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Upload className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[12.5px] font-semibold text-foreground">Upload a new PDF</p>
                  <p className="text-[11px] text-muted-foreground">PDF only · max 20 MB</p>
                </div>
              </button>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* UPLOAD STAGE — actual file picker */}
          {(stage === "upload" || stage === "uploading" || stage === "error") && (
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed py-9 transition-all duration-150 ${
                  stage === "uploading"
                    ? "pointer-events-none opacity-60"
                    : selectedFile
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                {stage === "uploading" ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-[12px] text-muted-foreground">Uploading…</span>
                  </>
                ) : selectedFile ? (
                  <>
                    <FileText className="h-7 w-7 text-primary" />
                    <span className="px-4 text-center text-[12px] font-medium text-foreground">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Click to change</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-[12.5px] font-medium text-foreground">
                        Click to select a PDF
                      </p>
                      <p className="text-[11px] text-muted-foreground">PDF only · max 20 MB</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={stage === "uploading"}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.type !== "application/pdf") {
                      setError("Only PDF files are accepted.");
                      return;
                    }
                    setSelectedFile(file);
                    setError(null);
                    if (stage === "error") setStage("upload");
                  }}
                />
              </label>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                  {error}
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || stage === "uploading"}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground transition-all duration-200 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.55)] active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none"
              >
                {stage === "uploading" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  "Upload & start chat"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
