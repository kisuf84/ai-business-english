"use client";

import { THEME } from "../../lib/theme";

type ScoreBannerProps = {
  correct: number;
  total: number;
  onReset: () => void;
};

export default function ScoreBanner({ correct, total, onReset }: ScoreBannerProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color =
    pct >= 80
      ? THEME.colors.success
      : pct >= 50
        ? THEME.colors.warning
        : THEME.colors.danger;
  const bg =
    pct >= 80
      ? THEME.colors.successSoft
      : pct >= 50
        ? THEME.colors.warningSoft
        : THEME.colors.dangerSoft;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: bg,
        border: `1px solid ${color}`,
        borderRadius: THEME.radius.md,
        padding: "16px 24px",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span
          style={{
            fontFamily: THEME.fonts.display,
            fontSize: "32px",
            color,
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
        <div>
          <p
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "14px",
              fontWeight: 600,
              color: THEME.colors.ink,
            }}
          >
            {correct} of {total} correct
          </p>
          <p
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "12px",
              color: THEME.colors.inkMuted,
              marginTop: "2px",
            }}
          >
            {pct >= 80
              ? "Excellent work"
              : pct >= 50
                ? "Good effort, review missed items"
                : "Keep practicing, you'll get there"}
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        style={{
          fontFamily: THEME.fonts.body,
          fontSize: "13px",
          fontWeight: 600,
          color: THEME.colors.accent,
          background: "transparent",
          border: `1px solid ${THEME.colors.accent}`,
          borderRadius: THEME.radius.pill,
          padding: "8px 20px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = THEME.colors.accentSoft;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        Try Again
      </button>
    </div>
  );
}
