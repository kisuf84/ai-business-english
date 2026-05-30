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
    "btn btn-ghost lumen-focus max-w-full justify-center text-center active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

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
