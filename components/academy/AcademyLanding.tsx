const SOURCE_URL = "/academy-landing-runtime.html";

export default function AcademyLanding() {
  return (
    <iframe
      title="Langslate Academy landing"
      src={SOURCE_URL}
      className="h-[calc(100dvh-var(--topbar-h)-36px)] min-h-[720px] w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-white"
    />
  );
}
