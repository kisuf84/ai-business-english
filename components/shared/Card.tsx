type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function Card({ children, style, className }: CardProps) {
  const baseClassName =
    "card card-pad min-w-0 overflow-hidden transition-all hover:border-[var(--line-strong)]";

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
