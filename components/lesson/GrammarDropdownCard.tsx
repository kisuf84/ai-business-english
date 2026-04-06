"use client";

import { THEME } from "../../lib/theme";

type GrammarDropdownCardProps = {
  number: number;
  instruction: string;
  sentence: string;
  options: string[];
  correctIndex: number;
  selectedAnswer: number | null;
  onSelect: (idx: number | null) => void;
  submitted: boolean;
};

export default function GrammarDropdownCard({
  number,
  instruction,
  sentence,
  options,
  correctIndex,
  selectedAnswer,
  onSelect,
  submitted,
}: GrammarDropdownCardProps) {
  const parts = sentence.split("___");
  const isCorrect = selectedAnswer === correctIndex;
  const hasAnswered = selectedAnswer !== null && selectedAnswer !== undefined;
  const showResult = submitted && hasAnswered;

  return (
    <div
      style={{
        background: THEME.colors.surface,
        border: `1px solid ${
          showResult
            ? isCorrect
              ? THEME.colors.successBorder
              : THEME.colors.dangerBorder
            : THEME.colors.border
        }`,
        borderRadius: THEME.radius.md,
        padding: "24px",
        boxShadow: THEME.shadow.sm,
        transition: "border-color 0.2s ease",
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
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "12px",
              fontWeight: 500,
              color: THEME.colors.accent,
              marginBottom: "10px",
            }}
          >
            {instruction}
          </p>
          <p
            style={{
              fontFamily: THEME.fonts.display,
              fontSize: "17px",
              color: THEME.colors.ink,
              lineHeight: 1.7,
            }}
          >
            {parts[0]}
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 4px",
              }}
            >
              <select
                value={hasAnswered ? selectedAnswer : ""}
                onChange={(e) =>
                  !submitted &&
                  onSelect(e.target.value === "" ? null : Number(e.target.value))
                }
                disabled={submitted}
                style={{
                  fontFamily: THEME.fonts.body,
                  fontSize: "14px",
                  fontWeight: 500,
                  padding: "6px 28px 6px 12px",
                  borderRadius: THEME.radius.sm,
                  border: `1.5px solid ${
                    showResult
                      ? isCorrect
                        ? THEME.colors.success
                        : THEME.colors.danger
                      : hasAnswered
                        ? THEME.colors.accent
                        : THEME.colors.border
                  }`,
                  background: showResult
                    ? isCorrect
                      ? THEME.colors.successSoft
                      : THEME.colors.dangerSoft
                    : THEME.colors.surfaceHover,
                  color: THEME.colors.ink,
                  cursor: submitted ? "default" : "pointer",
                  outline: "none",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B66' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  minWidth: "160px",
                }}
              >
                <option value="">Select answer...</option>
                {options.map((opt, i) => (
                  <option key={i} value={i}>
                    {opt}
                  </option>
                ))}
              </select>
            </span>
            {parts[1] || ""}
          </p>
        </div>
      </div>
      {showResult && (
        <div
          style={{
            marginTop: "14px",
            paddingLeft: "42px",
            fontFamily: THEME.fonts.body,
            fontSize: "13px",
            fontWeight: 500,
            color: isCorrect ? THEME.colors.success : THEME.colors.danger,
          }}
        >
          {isCorrect
            ? "Correct"
            : `Incorrect. The answer is: ${options[correctIndex]}`}
        </div>
      )}
    </div>
  );
}
