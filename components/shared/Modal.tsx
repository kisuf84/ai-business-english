type ModalProps = {
  children: React.ReactNode;
};

export default function Modal({ children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-8 backdrop-blur-sm">
      <div className="lumen-panel w-full max-w-xl rounded-[var(--radius-lg)] p-6">
        {children}
      </div>
    </div>
  );
}
