type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function Card({ children, style, className }: CardProps) {
  const baseClassName =
    "rounded-[28px] border border-[var(--border)] bg-[var(--surface-card)] p-8 shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md";

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
