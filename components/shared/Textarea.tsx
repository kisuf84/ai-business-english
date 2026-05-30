type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ style, className, ...props }: TextareaProps) {
  const baseClassName =
    "lumen-focus w-full rounded-[14px] border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-sm font-medium leading-6 text-[var(--ink)] shadow-sm backdrop-blur placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]";

  return (
    <textarea
      {...props}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={{
        minHeight: 120,
        ...style,
      }}
    />
  );
}
