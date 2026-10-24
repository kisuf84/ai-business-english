"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-6">
      <h1 className="text-xl font-bold text-white">Admin data could not be loaded</h1>
      <p className="mt-2 text-sm text-rose-100/80">No changes were made. Retry the read-only request.</p>
      <button className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950" onClick={reset} type="button">
        Retry
      </button>
    </div>
  );
}
