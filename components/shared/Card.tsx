type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function Card({ children, style, className }: CardProps) {
  const baseClassName =
    "min-w-0 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-card)] p-4 shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md sm:rounded-[24px] sm:p-5 lg:rounded-[28px] lg:p-8";

  return (
    <div
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={{
        ...style,
      }}
    >
      {children}
    </div>
  );
}
