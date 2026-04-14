"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";

type AuthModalProps = {
  open: boolean;
  defaultTab?: "signin" | "signup";
  onClose: () => void;
};

export function AuthModal({ open, defaultTab = "signin", onClose }: AuthModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#0c0d12] text-white/60 backdrop-blur-sm transition-all hover:border-white/30 hover:text-white"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <LoginForm defaultTab={defaultTab} />
      </div>
    </div>
  );
}
