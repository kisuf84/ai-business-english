type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-7">
      <p className="lumen-chip mb-3">Workspace</p>
      <h1 className="lumen-heading text-balance text-[34px] leading-[1.05] sm:text-[42px]">{title}</h1>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)] sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
