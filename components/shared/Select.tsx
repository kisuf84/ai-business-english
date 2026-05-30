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
    "lumen-focus w-full rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm font-medium text-[var(--ink)] shadow-sm backdrop-blur focus:border-[var(--accent)]";

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
