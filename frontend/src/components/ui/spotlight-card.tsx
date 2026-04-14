"use client";

import { useRef } from "react";
import type { MouseEvent } from "react";
import { cn } from "@/shared/lib/utils";

type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty("--mouse-x");
    card.style.removeProperty("--mouse-y");
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background:
          "radial-gradient(500px circle at var(--mouse-x, -9999px) var(--mouse-y, -9999px), rgba(34,211,238,0.07), transparent 40%)",
      }}
      className={cn("relative", className)}
    >
      {children}
    </div>
  );
}
