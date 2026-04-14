import Link from "next/link";
import { DatumLogo } from "./DatumLogo";

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-border/40">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <DatumLogo size={18} />
            <p className="text-[11px] text-muted-foreground/70">
              © {new Date().getFullYear()} Datum · MSA contract intelligence
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/chat"
              className="text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Chat
            </Link>
            <a
              href="https://github.com/Garvit-Nag"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
