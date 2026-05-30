type EmptyStateProps = {
  message: string;
};

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-6 text-sm text-[var(--ink-muted)] backdrop-blur">
      {message}
    </div>
  );
}
