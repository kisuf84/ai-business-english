import { THEME } from "../../lib/theme";

type SpeakingCardProps = {
  number: number;
  prompt: string;
};

export default function SpeakingCard({ number, prompt }: SpeakingCardProps) {
  return (
    <div
      style={{
        background: THEME.colors.surface,
        border: `1px solid ${THEME.colors.border}`,
        borderLeft: `3px solid ${THEME.colors.accent}`,
        borderRadius: THEME.radius.md,
        padding: "20px 24px",
        boxShadow: THEME.shadow.sm,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <span
          style={{
            fontFamily: THEME.fonts.body,
            fontSize: "12px",
            fontWeight: 700,
            color: THEME.colors.accent,
            background: THEME.colors.accentSoft,
            borderRadius: THEME.radius.pill,
            padding: "4px 10px",
            flexShrink: 0,
          }}
        >
          {String(number).padStart(2, "0")}
        </span>
        <p
          style={{
            fontFamily: THEME.fonts.body,
            fontSize: "15px",
            color: THEME.colors.ink,
            lineHeight: 1.6,
          }}
        >
          {prompt}
        </p>
      </div>
    </div>
  );
}
