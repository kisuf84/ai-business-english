"use client";

import { useState } from "react";
import { THEME } from "../../lib/theme";

type VocabCardProps = {
  term: string;
  definition: string;
  index: number;
};

export default function VocabCard({ term, definition, index }: VocabCardProps) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: "800px", cursor: "pointer", height: "180px" }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            background: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
            borderTop: `3px solid ${THEME.colors.accent}`,
            borderRadius: THEME.radius.md,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: THEME.shadow.sm,
          }}
        >
          <span
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: THEME.colors.accent,
              marginBottom: "12px",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: "24px",
              color: THEME.colors.ink,
              textAlign: "center",
            }}
          >
            {term}
          </span>
          <span
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "12px",
              color: THEME.colors.inkFaint,
              marginTop: "16px",
            }}
          >
            Tap to reveal definition
          </span>
        </div>
        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: THEME.colors.accent,
            borderRadius: THEME.radius.md,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: THEME.shadow.md,
          }}
        >
          <span
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: "20px",
              color: "#FFFFFF",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            {term}
          </span>
          <span
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "14px",
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {definition}
          </span>
        </div>
      </div>
    </div>
  );
}
