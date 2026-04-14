export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[hsl(222,47%,3%)]">
      {/* Cyan orb — top-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-60 -top-60 h-[55rem] w-[55rem] rounded-full bg-cyan-500/15 blur-[120px] animate-aurora-1"
      />
      {/* Violet orb — bottom-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-60 -right-60 h-[45rem] w-[45rem] rounded-full bg-violet-600/15 blur-[120px] animate-aurora-2"
      />
      {/* Blue orb — center, wrapper handles centering so animation only scales */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          aria-hidden="true"
          className="h-[35rem] w-[35rem] rounded-full bg-blue-500/10 blur-[100px] animate-aurora-3"
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
