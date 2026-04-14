"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

type Props = {
  onSend: (question: string) => void;
  isPending: boolean;
};

export function ChatInput({ onSend, isPending }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isPending) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  }

  const canSend = !!value.trim() && !isPending;

  return (
    <div className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl px-6 py-4"
      >
        <div className="group relative flex items-end gap-2 rounded-2xl border border-border/60 bg-card/60 p-2 pl-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_28px_-8px_hsl(var(--primary)/0.35)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything about this document…"
            rows={1}
            disabled={isPending}
            className="flex-1 resize-none bg-transparent py-2 text-[13.5px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:shadow-[0_0_18px_-2px_hsl(var(--primary)/0.6)] active:scale-[0.94] disabled:opacity-30 disabled:hover:shadow-none"
            aria-label="Send message"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/40">
          Answers grounded in document context · Shift + Enter for a new line
        </p>
      </form>
    </div>
  );
}
