"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useTransition, useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggle() {
    startTransition(() => {
      setTheme(theme === "dark" ? "light" : "dark");
    });
  }

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle theme"
      className="rounded-md p-2 text-muted-foreground transition-all duration-300 hover:rotate-12 hover:bg-muted/50 hover:text-foreground"
    >
      {!mounted ? <span className="inline-block h-4 w-4" /> : theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
