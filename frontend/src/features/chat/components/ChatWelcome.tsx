"use client";

import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "What are the payment terms?",
  "What is the termination notice period?",
  "Who owns the intellectual property?",
  "What are the liability caps?",
];

type Props = {
  documentName: string;
};

export function ChatWelcome({ documentName }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Ready to analyse
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Ask anything about{" "}
          <span className="font-medium text-foreground/90">{documentName}</span>.
          Answers are grounded in the document.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-[11.5px] text-muted-foreground backdrop-blur-sm"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
