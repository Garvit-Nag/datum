"use client";

import { useState, useRef } from "react";
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
  const [showFormat, setShowFormat] = useState(false);
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

  // ── Run evaluation ────────────────────────────────────────
  async function handleRun() {
    if (!canRun) return;
    await trigger({ document_id: selectedDocId, ground_truth_text: groundTruthText });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Evaluation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Run the LLM-as-judge pipeline on your ground truth Q&A file.
        </p>
      </div>

      {/* ── Step 1: Ground truth ── */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">1</span>
            <span className="text-sm font-medium">Ground Truth</span>
            {validated && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {validated.count} questions
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {validated && (
              <button
                onClick={resetGroundTruth}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
            <button
              onClick={() => setShowFormat((v) => !v)}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              Format
            </button>
            {!validated && (
              <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                {(["paste", "upload"] as InputModeType[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setInputMode(mode); setValidationError(null); }}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                      inputMode === mode
                        ? "bg-background shadow-sm text-foreground"
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

        {/* Format guide */}
        {showFormat && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-xs">
            <p className="font-medium">Format guide</p>
            <p className="text-muted-foreground">
              Each block separated by a blank line. Lines must start with{" "}
              <code className="bg-muted px-1 rounded">C:</code> (category),{" "}
              <code className="bg-muted px-1 rounded">Q:</code> (question), and{" "}
              <code className="bg-muted px-1 rounded">A:</code> (expected answer).
              The <code className="bg-muted px-1 rounded">C:</code> line is required for the evaluation table.
            </p>
            <pre className="rounded-md bg-muted p-3 leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
              {FORMAT_EXAMPLE}
            </pre>
          </div>
        )}

        {/* Validated state */}
        {validated ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="text-sm font-medium text-foreground">{validated.count} questions ready</p>
              <p className="text-xs text-muted-foreground">Ground truth validated. Proceed to step 2.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Input area */}
            {inputMode === "paste" ? (
              <textarea
                className="w-full h-48 resize-none rounded-lg border bg-background px-3 py-2.5 text-sm font-mono leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder={"C: Payment Terms\nQ: When is an invoice due?\nA: Payment is due within 30 days of invoice receipt.\n\nC: Termination Notice Period\nQ: What is the termination notice period?\nA: Either party may terminate with 30 days written notice."}
                value={pastedText}
                onChange={(e) => { setPastedText(e.target.value); setValidationError(null); }}
              />
            ) : (
              <div
                className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 transition-colors hover:bg-muted/40"
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

            {/* Validation error */}
            {validationError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {validationError}
              </div>
            )}

            {/* Validate button */}
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

      {/* ── Step 2: Document (only after valid GT) ── */}
      {validated && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">2</span>
            <span className="text-sm font-medium">Document</span>
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

          {/* Mode toggle */}
          <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5 w-fit">
            {(["existing", "new"] as DocModeType[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setDocMode(mode); setSelectedDocId(""); setDocStage("idle"); setDocError(null); setPdfFile(null); }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  docMode === mode
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "existing" ? "Existing document" : "Upload new PDF"}
              </button>
            ))}
          </div>

          {docMode === "existing" ? (
            readyDocs.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground px-4 text-center">
                  No ready documents. Switch to "Upload new PDF" to add one.
                </p>
              </div>
            ) : (
              <div className="relative max-w-sm">
                <select
                  className="w-full appearance-none rounded-lg border bg-background px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                >
                  <option value="">— choose a document —</option>
                  {readyDocs.map((d) => (
                    <option key={d.id} value={d.id}>{d.filename}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            )
          ) : (
            <div className="space-y-3">
              {(docStage === "idle" || docStage === "error") && (
                <>
                  <label
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed py-8 transition-colors ${
                      pdfFile ? "border-primary/30 bg-primary/5" : "hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    {pdfFile ? (
                      <>
                        <FileText className="h-7 w-7 text-primary" />
                        <p className="text-sm font-medium">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-7 w-7 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Click to select a <span className="font-medium text-foreground">PDF</span></p>
                      </>
                    )}
                    <input
                      ref={pdfRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => { setPdfFile(e.target.files?.[0] ?? null); setDocError(null); }}
                    />
                  </label>
                  {docError && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {docError}
                    </div>
                  )}
                  <Button onClick={handleDocUpload} disabled={!pdfFile} size="sm" className="gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    Upload &amp; Process
                  </Button>
                </>
              )}

              {(docStage === "uploading" || docStage === "processing") && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {docStage === "uploading" ? "Uploading…" : "Processing document…"}
                    </p>
                    <p className="text-xs text-muted-foreground">Please wait, don't close this page.</p>
                  </div>
                </div>
              )}

              {docStage === "ready" && (
                <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
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

      {/* ── Run button ── */}
      {validated && (
        <div className="flex items-center gap-4">
          <Button onClick={handleRun} disabled={!canRun} className="gap-2 px-6">
            <Play className="h-4 w-4" />
            {isRunning ? "Running Evaluation…" : "Run Evaluation"}
          </Button>
          {isRunning && (
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {!progress && (
                <p className="animate-pulse">
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
                      <span className="ml-2">• {progress.remaining} remaining</span>
                    )}
                  </p>
                  <div className="h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                  {progress.lastQuestion && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">
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
                    <span className="ml-2 animate-pulse">• Running LLM-as-judge evaluation…</span>
                  </p>
                  <div className="h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-full rounded-full bg-primary/40 animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground">Comparing all answers against ground truth…</p>
                </>
              )}

              {progress?.phase === "verdicts" && (
                <>
                  <p>
                    <span className="font-medium text-foreground">
                      Verdict {progress.completed} of {progress.total}
                    </span>
                    {progress.remaining > 0 && (
                      <span className="ml-2">• {progress.remaining} remaining</span>
                    )}
                  </p>
                  <div className="h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Q{progress.lastRow.id} — {progress.lastRow.verdict}
                  </p>
                </>
              )}
            </div>
          )}
          {runError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive max-w-md">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{getEvalErrorMessage(runError)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {runsLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!runsLoading && runs && runs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Evaluation Run</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {runs.length} total
              </span>
            </div>
            {runs.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Run</span>
                {runs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRunIndex(i)}
                    className={`h-7 w-7 rounded-md text-xs font-medium transition-all ${
                      selectedRunIndex === i
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          No evaluation runs yet. Add your ground truth above to get started.
        </div>
      )}
    </div>
  );
}
