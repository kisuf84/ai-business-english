type LessonSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function LessonSection({ title, children }: LessonSectionProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-5 backdrop-blur">
      <h2 className="lumen-heading mb-3 text-2xl">{title}</h2>
      <div className="text-sm leading-7 text-[var(--ink-muted)]">{children}</div>
    </section>
  );
}
