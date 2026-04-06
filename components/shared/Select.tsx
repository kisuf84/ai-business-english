type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

export default function Select({
  children,
  style,
  className,
  ...props
}: SelectProps) {
  const baseClassName =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--ink)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)]";

  return (
    <select
      {...props}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={{
        ...style,
      }}
    >
      {children}
    </select>
  );
}
