"use client";

import { useState, useRef, useEffect } from "react";
import {
  Info, Upload, FileText, Play, ChevronDown,
  X, CheckCircle2, Loader2, AlertCircle, ChevronRight,
} from "lucide-react";
import { useDocuments, useUploadDocument } from "@/features/document/hooks/useDocuments";
import { useTriggerEvaluation, useEvaluationResults } from "@/features/evaluation/hooks/useEvaluation";
import { fetchDocuments } from "@/features/document/services/document-service";
import { EvaluationSummaryTable } from "./EvaluationSummaryTable";
import { Button } from "@/components/ui/button";

const FORMAT_EXAMPLE = `C: Payment Terms
Q: Within how many days may a Customer exercise the return policy?
A: Under Section 10.3, within thirty (30) days of the initial Order, Customer may terminate and receive a refund.

C: Late Payment Penalty
Q: What may Atlassian do if payment is overdue, and what notice is required?
A: Under Section 10.4, Atlassian may suspend access after giving no fewer than ten (10) days written notice.`;

type InputModeType = "paste" | "upload";
type DocModeType = "existing" | "new";
type DocUploadStageType = "idle" | "uploading" | "processing" | "ready" | "error";

function getEvalErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Evaluation failed. Check your inputs and try again.";
  const msg = error.message;
  if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
    return "Rate limit reached — please wait a moment and try again.";
  }
  if (msg.includes("502") || msg.includes("LLM_ERROR") || msg.toLowerCase().includes("llm")) {
    return "The LLM service is temporarily unavailable. Try again shortly.";
  }
  if (msg.includes("422")) {
    return "Invalid evaluation input. Check your Q&A format.";
  }
  if (msg.includes("Not authenticated")) {
    return "Session expired — please refresh the page and try again.";
  }
  if (msg.includes("stream ended")) {
    return "Evaluation stream was interrupted. Please try again.";
  }
  return msg.length > 150 ? msg.slice(0, 150) + "…" : msg;
}

type ParsedPairType = { category: string; question: string; answer: string };
type GroundTruthParseResultType = { pairs: ParsedPairType[]; error: string | null };

function parseGroundTruth(text: string): GroundTruthParseResultType {
  const blocks = text.trim().split(/\n\s*\n/);
  const pairs: ParsedPairType[] = [];

  for (const [i, block] of blocks.entries()) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const cLine = lines.find((l) => l.trim().toUpperCase().startsWith("C:"));
    const qLine = lines.find((l) => l.trim().toUpperCase().startsWith("Q:"));
    const aLine = lines.find((l) => l.trim().toUpperCase().startsWith("A:"));

    if (cLine && qLine && aLine) {
      pairs.push({
        category: cLine.split(":").slice(1).join(":").trim(),
        question: qLine.split(":").slice(1).join(":").trim(),
        answer: aLine.split(":").slice(1).join(":").trim(),
      });
    } else if (cLine || qLine || aLine) {
      const missing = (
        [!cLine && "C:", !qLine && "Q:", !aLine && "A:"] as (string | false)[]
      ).filter((x): x is string => !!x);
      return {
        pairs: [],
        error: `Block ${i + 1} is missing: ${missing.join(", ")}. Every block must have a C: (category), Q: (question), and A: (answer) line.`,
      };
    }
  }

  return { pairs, error: null };
}

function FormatInfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
          <div>
            <h2 className="text-[14px] font-semibold tracking-tight text-foreground">Ground Truth Format</h2>
            <p className="text-[11px] text-muted-foreground">Required structure for Q&amp;A pairs</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Each block must be separated by a blank line. Lines must start with{" "}
            <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground/80">C:</code> (category),{" "}
            <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground/80">Q:</code> (question), and{" "}
            <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground/80">A:</code> (expected answer).
          </p>
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/70">
              {FORMAT_EXAMPLE}
            </pre>
          </div>
          <Button onClick={onClose} variant="outline" size="sm" className="w-full">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EvaluationPageClient() {
  const { data: documents, refetch: refetchDocs } = useDocuments();
  const { data: runs, isLoading: runsLoading } = useEvaluationResults();
  const {
    mutateAsync: trigger,
    isPending: isRunning,
    error: runError,
    progress,
  } = useTriggerEvaluation();
  const { mutateAsync: uploadDoc } = useUploadDocument();

  // ── Step 1: ground truth ──────────────────────────────────
  const [inputMode, setInputMode] = useState<InputModeType>("paste");
  const [pastedText, setPastedText] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [txtFileName, setTxtFileName] = useState<string | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [validated, setValidated] = useState<{ count: number; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const txtRef = useRef<HTMLInputElement>(null);

  const [selectedRunIndex, setSelectedRunIndex] = useState(0);

  // ── Step 2: document ──────────────────────────────────────
  const [docMode, setDocMode] = useState<DocModeType>("existing");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docStage, setDocStage] = useState<DocUploadStageType>("idle");
  const [docError, setDocError] = useState<string | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const readyDocs = documents?.filter((d) => d.status === "ready") ?? [];
  const groundTruthText = validated?.text ?? "";
  const docReady = docMode === "existing" ? !!selectedDocId : docStage === "ready";
  const canRun = !!validated && docReady && !isRunning;

  // ── Handlers: ground truth ────────────────────────────────
  function handleTxtFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTxtFileName(file.name);
    setValidated(null);
    setValidationError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  function handleValidate() {
    const raw = inputMode === "paste" ? pastedText : uploadedText;
    const { pairs, error } = parseGroundTruth(raw);
    if (error) {
      setValidated(null);
      setValidationError(error);
      return;
    }
    if (pairs.length === 0) {
      setValidated(null);
      setValidationError(
        "No valid Q&A pairs found. Each block needs C:, Q:, and A: lines separated by a blank line."
      );
      return;
    }
    setValidationError(null);
    setValidated({ count: pairs.length, text: raw });
  }

  function resetGroundTruth() {
    setValidated(null);
    setValidationError(null);
    setPastedText("");
    setUploadedText("");
    setTxtFileName(null);
    if (txtRef.current) txtRef.current.value = "";
    setSelectedDocId("");
    setDocStage("idle");
    setDocError(null);
    setPdfFile(null);
  }

  // ── Handlers: document upload ─────────────────────────────
  async function handleDocUpload() {
    if (!pdfFile) return;
    setDocError(null);
    setDocStage("uploading");
    try {
      const doc = await uploadDoc(pdfFile);
      setDocStage("processing");
      await pollDocUntilReady(doc.id);
    } catch {
      setDocStage("error");
      setDocError("Upload failed. Please try again.");
    }
  }

  async function pollDocUntilReady(docId: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const docs = await fetchDocuments();
        const doc = docs.find((d) => d.id === docId);
        if (!doc) continue;
        if (doc.status === "ready") {
          await refetchDocs();
          setSelectedDocId(docId);
          setDocStage("ready");
          return;
        }
        if (doc.status === "failed") {
          setDocStage("error");
          setDocError("Document processing failed. Try a different file.");
          return;
        }
      } catch {
        // network blip
      }
    }
    setDocStage("error");
    setDocError("Processing timed out. Please try again.");
  }

  async function handleRun() {
    if (!canRun) return;
    await trigger({ document_id: selectedDocId, ground_truth_text: groundTruthText });
  }

  return (
    <>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary/70">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          LLM-as-Judge
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Evaluation</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Run the judge pipeline on your ground truth Q&amp;A file. Generates answers,
          judges them, and shows live progress.
        </p>
      </div>

      <div className={`grid gap-6 ${validated ? "lg:grid-cols-2 items-stretch" : "grid-cols-1"}`}>
        {/* ── Left Column ── */}
        <div className="flex flex-col gap-6">
          {/* ── Step 1: Ground truth ── */}
          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">1</span>
                <span className="text-sm font-medium text-foreground">Ground Truth</span>
                {validated && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {validated.count} questions
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {validated && (
                  <button
                    onClick={resetGroundTruth}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Reset
                  </button>
                )}
                {/* Format info — opens centered modal */}
                <button
                  onClick={() => setShowFormatModal(true)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                  Format
                </button>
                {!validated && (
                  <div className="flex gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-0.5">
                    {(["paste", "upload"] as InputModeType[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => { setInputMode(mode); setValidationError(null); }}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                          inputMode === mode
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode === "paste" ? "Paste text" : "Upload .txt"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Validated state */}
            {validated ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{validated.count} questions ready</p>
                  <p className="text-xs text-muted-foreground">Ground truth validated. Proceed to step 2.</p>
                </div>
              </div>
            ) : (
              <>
                {inputMode === "paste" ? (
                  <textarea
                    className="h-48 w-full resize-none rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/40 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={"C: Payment Terms\nQ: When is an invoice due?\nA: Payment is due within 30 days of invoice receipt.\n\nC: Termination Notice Period\nQ: What is the termination notice period?\nA: Either party may terminate with 30 days written notice."}
                    value={pastedText}
                    onChange={(e) => { setPastedText(e.target.value); setValidationError(null); }}
                  />
                ) : (
                  <div
                    className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/30 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30"
                    onClick={() => txtRef.current?.click()}
                  >
                    <input ref={txtRef} type="file" accept=".txt" className="hidden" onChange={handleTxtFile} />
                    {txtFileName ? (
                      <>
                        <FileText className="h-7 w-7 text-primary/70" />
                        <div className="text-center">
                          <p className="text-sm font-medium">{txtFileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {uploadedText.split("\n").filter((l) => l.trim().toUpperCase().startsWith("Q:")).length} Q: lines found
                          </p>
                        </div>
                        <button
                          className="text-xs text-muted-foreground underline-offset-2 underline hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setTxtFileName(null); setUploadedText(""); if (txtRef.current) txtRef.current.value = ""; }}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-7 w-7 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Click to upload a <span className="font-medium text-foreground">.txt</span> file</p>
                      </>
                    )}
                  </div>
                )}

                {validationError && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {validationError}
                  </div>
                )}

                <Button
                  onClick={handleValidate}
                  disabled={inputMode === "paste" ? !pastedText.trim() : !uploadedText.trim()}
                  className="gap-2"
                  size="sm"
                >
                  Validate Q&A
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* ── Run button ── */}
          {validated && (
            <div className="flex-1 rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm flex flex-col justify-between animate-fade-up">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">3</span>
                  <span className="text-sm font-medium text-foreground">Execution</span>
                </div>
                <p className="text-[12.5px] text-muted-foreground mt-2 ml-9">
                  Ensure your document is ready before running the evaluation.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <Button onClick={handleRun} disabled={!canRun} className="gap-2 w-full h-10 text-[13px] font-medium" variant="default">
                  <Play className="h-3.5 w-3.5 shrink-0" />
                  {isRunning ? "Running Evaluation…" : "Run Evaluation"}
                </Button>

                {isRunning && (
                  <div className="flex flex-col gap-2 text-[12px] text-muted-foreground rounded-xl border border-border/40 bg-background/50 p-3.5 shadow-sm">
                    {!progress && (
                      <p className="animate-pulse font-medium text-foreground">
                        Starting evaluation for {validated.count} question{validated.count === 1 ? "" : "s"}…
                      </p>
                    )}

                    {progress?.phase === "answers" && (
                      <>
                        <p>
                          <span className="font-medium text-foreground">
                            Generating answer {progress.completed} of {progress.total}
                          </span>
                          {progress.remaining > 0 && (
                            <span className="ml-1.5 opacity-70">· {progress.remaining} remaining</span>
                          )}
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60 mt-1">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                          />
                        </div>
                        {progress.lastQuestion && (
                          <p className="truncate mt-1.5 text-[11px] opacity-70">
                            {progress.lastQuestion.slice(0, 80)}{progress.lastQuestion.length > 80 ? "…" : ""}
                          </p>
                        )}
                      </>
                    )}

                    {progress?.phase === "judging" && (
                      <>
                        <p>
                          <span className="font-medium text-foreground">
                            All {progress.total} answers ready
                          </span>
                          <span className="ml-1.5 animate-pulse text-primary font-medium">· Running Judge…</span>
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60 mt-1">
                          <div className="h-full w-full rounded-full bg-primary/40 animate-pulse" />
                        </div>
                      </>
                    )}

                    {progress?.phase === "verdicts" && (
                      <>
                        <p>
                          <span className="font-medium text-foreground">
                            Verdict {progress.completed} of {progress.total}
                          </span>
                          {progress.remaining > 0 && (
                            <span className="ml-1.5 opacity-70">· {progress.remaining} remaining</span>
                          )}
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60 mt-1">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                {runError && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{getEvalErrorMessage(runError)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Step 2 Document (only after valid GT) ── */}
        {validated && (
          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">2</span>
              <span className="text-sm font-medium text-foreground">Document</span>
              {docStage === "ready" && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </span>
              )}
              {selectedDocId && docMode === "existing" && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Selected
                </span>
              )}
            </div>

            <div className="flex w-full gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
              {(["existing", "new"] as DocModeType[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setDocMode(mode); setSelectedDocId(""); setDocStage("idle"); setDocError(null); setPdfFile(null); }}
                  className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    docMode === mode
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {mode === "existing" ? "Select Existing" : "Upload New PDF"}
                </button>
              ))}
            </div>

            {docMode === "existing" ? (
              readyDocs.length === 0 ? (
                <div className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/30 transition-colors hover:border-border/80 hover:bg-muted/20">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                  <p className="px-6 text-center text-sm text-muted-foreground">
                    No documents available.<br />
                    <button className="mt-1.5 font-medium text-primary hover:underline underline-offset-4" onClick={() => setDocMode("new")}>Upload your first PDF</button>
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-1 rounded-xl border border-border/50 bg-background/50 p-1.5 h-[220px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="px-2.5 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/80 backdrop-blur-md z-10 rounded-t-lg">
                    Available Documents
                  </div>
                  {readyDocs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDocId(d.id)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all text-left ${
                        selectedDocId === d.id
                          ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                          : "hover:bg-muted/50 text-foreground/80 border border-transparent hover:text-foreground"
                      }`}
                    >
                      <FileText className={`h-5 w-5 shrink-0 ${selectedDocId === d.id ? "text-primary" : "text-muted-foreground/60"}`} />
                      <span className="truncate">{d.filename}</span>
                      {selectedDocId === d.id && (
                        <CheckCircle2 className="h-5 w-5 ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col h-[220px] items-center justify-center gap-4 rounded-xl border border-border/40 bg-background/30 p-4">
                {(docStage === "idle" || docStage === "error") && (
                  <div className="flex flex-col items-center w-full max-w-[280px] gap-3">
                    <label
                      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed py-5 transition-all duration-150 ${
                        pdfFile ? "border-primary/40 bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      {pdfFile ? (
                        <>
                          <FileText className="h-6 w-6 text-primary" />
                          <p className="text-sm font-medium text-center px-4 truncate max-w-full">{pdfFile.name}</p>
                          <p className="text-[11px] text-muted-foreground">Click to change</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground mt-0.5">Select a <span className="font-medium text-foreground">PDF</span></p>
                        </>
                      )}
                      <input
                        ref={pdfRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file && file.type !== "application/pdf") {
                            setDocError("Only PDF files are accepted.");
                            return;
                          }
                          setPdfFile(file);
                          setDocError(null);
                        }}
                      />
                    </label>
                    {docError && (
                      <div className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive text-center">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {docError}
                      </div>
                    )}
                    <Button onClick={handleDocUpload} disabled={!pdfFile} size="default" className="w-full gap-2 rounded-xl h-9 shadow-sm">
                      <Upload className="h-3.5 w-3.5" />
                      Upload &amp; Process
                    </Button>
                  </div>
                )}

                {(docStage === "uploading" || docStage === "processing") && (
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-4">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {docStage === "uploading" ? "Uploading…" : "Processing document…"}
                      </p>
                      <p className="text-xs text-muted-foreground">Please wait, don't close this page.</p>
                    </div>
                  </div>
                )}

                {docStage === "ready" && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Document ready</p>
                      <p className="text-xs text-muted-foreground">{pdfFile?.name}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {runsLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      )}

      {!runsLoading && runs && runs.length > 0 && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Evaluation Run</h2>
              <span className="rounded-full border border-border/50 bg-card/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                {runs.length} total
              </span>
            </div>
            {runs.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="mr-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">Run</span>
                {runs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRunIndex(i)}
                    className={`h-7 w-7 rounded-lg text-xs font-medium transition-all ${
                      selectedRunIndex === i
                        ? "bg-primary text-primary-foreground shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]"
                        : "border border-border/50 bg-card/60 text-muted-foreground backdrop-blur-sm hover:border-border hover:text-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <EvaluationSummaryTable run={runs[selectedRunIndex]} />
        </div>
      )}

      {!runsLoading && (!runs || runs.length === 0) && !validated && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 py-16 text-center text-sm text-muted-foreground backdrop-blur-sm">
          No evaluation runs yet. Add your ground truth above to get started.
        </div>
      )}

      </div>

      {/* Format info modal */}
      {showFormatModal && <FormatInfoModal onClose={() => setShowFormatModal(false)} />}
    </>
  );
}
