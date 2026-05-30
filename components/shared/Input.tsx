type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ style, className, ...props }: InputProps) {
  const baseClassName =
    "lumen-focus w-full rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm font-medium text-[var(--ink)] shadow-sm backdrop-blur placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]";

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
