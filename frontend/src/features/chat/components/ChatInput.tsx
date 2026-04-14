"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask a question about the document..."
          rows={1}
          disabled={isPending}
          className="flex-1 resize-none rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isPending || !value.trim()}
          className="h-11 w-11 shrink-0 rounded-xl"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
      <p className="pb-2 text-center text-[11px] text-muted-foreground/40">
        Answers are generated from document context only
      </p>
    </div>
  );
}
