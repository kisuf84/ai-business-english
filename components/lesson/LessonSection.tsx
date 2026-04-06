type LessonSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function LessonSection({ title, children }: LessonSectionProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ marginBottom: 10, fontSize: 18 }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
