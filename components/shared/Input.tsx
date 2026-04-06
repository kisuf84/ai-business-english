type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ style, className, ...props }: InputProps) {
  const baseClassName =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--ink)] shadow-sm placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)]";

  return (
    <input
      {...props}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={{
        ...style,
      }}
    />
  );
}
