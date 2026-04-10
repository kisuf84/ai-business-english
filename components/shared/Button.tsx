type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function Button({
  children,
  style,
  className,
  ...props
}: ButtonProps) {
  const baseClassName =
    "inline-flex max-w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] px-4 py-2 text-center text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] hover:shadow-md active:translate-y-0";

  return (
    <button
      type="button"
      {...props}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={{
        cursor: "pointer",
        transition: "transform 0.08s ease, box-shadow 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
