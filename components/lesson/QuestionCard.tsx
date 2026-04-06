"use client";

import { THEME } from "../../lib/theme";

type QuestionCardProps = {
  number: number;
  question: string;
  options: string[];
  correctIndex: number;
  instruction?: string;
  sentence?: string;
  selectedAnswer: number | null;
  onSelect: (idx: number) => void;
  submitted: boolean;
};

export default function QuestionCard({
  number,
  question,
  options,
  correctIndex,
  instruction,
  sentence,
  selectedAnswer,
  onSelect,
  submitted,
}: QuestionCardProps) {
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
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          marginBottom: "8px",
        }}
      >
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
            letterSpacing: "0.04em",
          }}
        >
          {String(number).padStart(2, "0")}
        </span>
        <div style={{ flex: 1 }}>
          {instruction && (
            <p
              style={{
                fontFamily: THEME.fonts.body,
                fontSize: "12px",
                fontWeight: 500,
                color: THEME.colors.accent,
                marginBottom: "6px",
                letterSpacing: "0.02em",
              }}
            >
              {instruction}
            </p>
          )}
          {sentence && (
            <p
              style={{
                fontFamily: THEME.fonts.display,
                fontSize: "17px",
                color: THEME.colors.ink,
                lineHeight: 1.5,
                marginBottom: "4px",
              }}
            >
              {sentence}
            </p>
          )}
          <p
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: "15px",
              fontWeight: 500,
              color: THEME.colors.ink,
              lineHeight: 1.5,
            }}
          >
            {question}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "16px",
          paddingLeft: "42px",
        }}
      >
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isThisCorrect = idx === correctIndex;
          let optionBg = THEME.colors.surfaceHover;
          let optionBorder = THEME.colors.borderLight;
          let optionColor = THEME.colors.ink;
          let indicatorBg = "transparent";
          let indicatorBorder = THEME.colors.border;
          let indicatorContent = "";
          let indicatorColor = "transparent";

          if (isSelected && !submitted) {
            optionBg = THEME.colors.accentSoft;
            optionBorder = THEME.colors.accent;
            indicatorBg = THEME.colors.accent;
            indicatorBorder = THEME.colors.accent;
            indicatorContent = "✓";
            indicatorColor = THEME.colors.accentInk;
          }
          if (submitted && isSelected && isThisCorrect) {
            optionBg = THEME.colors.successSoft;
            optionBorder = THEME.colors.successBorder;
            optionColor = THEME.colors.success;
            indicatorBg = THEME.colors.success;
            indicatorBorder = THEME.colors.success;
            indicatorContent = "✓";
            indicatorColor = THEME.colors.accentInk;
          }
          if (submitted && isSelected && !isThisCorrect) {
            optionBg = THEME.colors.dangerSoft;
            optionBorder = THEME.colors.dangerBorder;
            optionColor = THEME.colors.danger;
            indicatorBg = THEME.colors.danger;
            indicatorBorder = THEME.colors.danger;
            indicatorContent = "✗";
            indicatorColor = THEME.colors.accentInk;
          }
          if (submitted && !isSelected && isThisCorrect) {
            optionBg = THEME.colors.successSoft;
            optionBorder = THEME.colors.successBorder;
            optionColor = THEME.colors.success;
            indicatorBg = THEME.colors.success;
            indicatorBorder = THEME.colors.success;
            indicatorContent = "✓";
            indicatorColor = THEME.colors.accentInk;
          }

          return (
            <button
              key={idx}
              onClick={() => !submitted && onSelect(idx)}
              disabled={submitted}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: optionBg,
                border: `1px solid ${optionBorder}`,
                borderRadius: THEME.radius.sm,
                cursor: submitted ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                opacity: submitted && !isSelected && !isThisCorrect ? 0.5 : 1,
                width: "100%",
              }}
            >
              <span
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: `2px solid ${indicatorBorder}`,
                  background: indicatorBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: indicatorColor,
                  flexShrink: 0,
                  fontFamily: THEME.fonts.body,
                }}
              >
                {indicatorContent || String.fromCharCode(65 + idx)}
              </span>
              <span
                style={{
                  fontFamily: THEME.fonts.body,
                  fontSize: "14px",
                  color: optionColor,
                  fontWeight: isSelected ? 500 : 400,
                  lineHeight: 1.4,
                }}
              >
                {option}
              </span>
            </button>
          );
        })}
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
