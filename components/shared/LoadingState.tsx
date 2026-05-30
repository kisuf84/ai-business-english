export default function LoadingState() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        <p className="text-sm font-semibold text-[var(--ink)]">Loading...</p>
      </div>
      <div className="mt-5 grid gap-3">
        <span className="h-3 w-2/3 rounded-full bg-[var(--glass-strong)]" />
        <span className="h-3 w-full rounded-full bg-[var(--glass)]" />
        <span className="h-3 w-4/5 rounded-full bg-[var(--glass)]" />
      </div>
    </div>
  );
}
