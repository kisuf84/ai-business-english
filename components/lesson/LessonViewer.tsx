"use client";

import { useState, useCallback, useMemo, type CSSProperties } from "react";
import type { LessonGenerationOutput } from "../../types/lesson";
import { useTheme } from "../../context/ThemeContext";
import VocabCard from "./VocabCard";
import QuestionCard from "./QuestionCard";
import ScoreBanner from "./ScoreBanner";

type Tab = {
  id: string;
  label: string;
};

const TABS: Tab[] = [
  { id: "vocabulary", label: "Vocabulary" },
  { id: "reading", label: "Reading Text" },
  { id: "comprehension", label: "Comprehension" },
  { id: "grammar", label: "Grammar" },
  { id: "roleplay", label: "Role Play" },
  { id: "quiz", label: "Quiz" },
];

type AnswerMap = Record<string, number>;
type QuestionSection = "comprehension" | "grammar" | "quiz";
type ValidationNoticeMap = Record<QuestionSection, string | null>;

type LessonViewerProps = {
  lesson: LessonGenerationOutput;
};

export default function LessonViewer({ lesson }: LessonViewerProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("vocabulary");
  const sectionPaddingX = "clamp(16px, 4vw, 28px)";

  const [compAnswers, setCompAnswers] = useState<AnswerMap>({});
  const [compSubmitted, setCompSubmitted] = useState(false);

  const [grammarAnswers, setGrammarAnswers] = useState<AnswerMap>({});
  const [grammarSubmitted, setGrammarSubmitted] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState<AnswerMap>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [validationNotice, setValidationNotice] = useState<ValidationNoticeMap>({
    comprehension: null,
    grammar: null,
    quiz: null,
  });

  const formatMissingQuestionList = (numbers: number[]) => {
    if (numbers.length === 1) return String(numbers[0]);
    if (numbers.length === 2) return `${numbers[0]} and ${numbers[1]}`;
    return `${numbers.slice(0, -1).join(", ")}, and ${numbers[numbers.length - 1]}`;
  };

  const buildMissingQuestionMessage = (numbers: number[]) => {
    if (numbers.length === 1) {
      return `Please answer Question ${numbers[0]} before submitting.`;
    }
    return `You still need to answer Questions ${formatMissingQuestionList(numbers)}.`;
  };

  const getQuestionAnchorId = (section: QuestionSection, questionNumber: number) =>
    `${section}-question-${questionNumber}`;

  const scrollToFirstMissingQuestion = (
    section: QuestionSection,
    firstMissingQuestionNumber: number
  ) => {
    if (typeof window === "undefined") return;
    const element = document.getElementById(
      getQuestionAnchorId(section, firstMissingQuestionNumber)
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const compScore = useMemo(() => {
    if (!compSubmitted) return null;
    let correct = 0;
    lesson.comprehension_questions.forEach((q) => {
      if (compAnswers[q.id] === q.correct_index) correct++;
    });
    return { correct, total: lesson.comprehension_questions.length };
  }, [compSubmitted, compAnswers, lesson.comprehension_questions]);

  const grammarScore = useMemo(() => {
    if (!grammarSubmitted) return null;
    let correct = 0;
    lesson.grammar_exercises.forEach((q) => {
      if (grammarAnswers[q.id] === q.correct_index) correct++;
    });
    return { correct, total: lesson.grammar_exercises.length };
  }, [grammarSubmitted, grammarAnswers, lesson.grammar_exercises]);

  const quizScore = useMemo(() => {
    if (!quizSubmitted) return null;
    let correct = 0;
    lesson.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_index) correct++;
    });
    return { correct, total: lesson.quiz.length };
  }, [quizSubmitted, quizAnswers, lesson.quiz]);

  const resetSection = useCallback((section: "comprehension" | "grammar" | "quiz") => {
    if (section === "comprehension") {
      setCompAnswers({});
      setCompSubmitted(false);
    } else if (section === "grammar") {
      setGrammarAnswers({});
      setGrammarSubmitted(false);
    } else {
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
    setValidationNotice((prev) => ({ ...prev, [section]: null }));
  }, []);

  const compAllAnswered = lesson.comprehension_questions.every(
    (q) => compAnswers[q.id] !== undefined
  );
  const missingCompQuestions = lesson.comprehension_questions
    .map((q, index) => ({ id: q.id, number: index + 1 }))
    .filter((q) => compAnswers[q.id] === undefined)
    .map((q) => q.number);

  const grammarAllAnswered = lesson.grammar_exercises.every(
    (q) => grammarAnswers[q.id] !== undefined
  );
  const missingGrammarQuestions = lesson.grammar_exercises
    .map((q, index) => ({ id: q.id, number: index + 1 }))
    .filter((q) => grammarAnswers[q.id] === undefined)
    .map((q) => q.number);

  const quizAllAnswered = lesson.quiz.every(
    (q) => quizAnswers[q.id] !== undefined
  );
  const missingQuizQuestions = lesson.quiz
    .map((q, index) => ({ id: q.id, number: index + 1 }))
    .filter((q) => quizAnswers[q.id] === undefined)
    .map((q) => q.number);

  const handleSectionSubmit = (section: QuestionSection) => {
    const missingBySection: Record<QuestionSection, number[]> = {
      comprehension: missingCompQuestions,
      grammar: missingGrammarQuestions,
      quiz: missingQuizQuestions,
    };
    const missing = missingBySection[section];

    if (missing.length > 0) {
      setValidationNotice((prev) => ({
        ...prev,
        [section]: buildMissingQuestionMessage(missing),
      }));
      scrollToFirstMissingQuestion(section, missing[0]);
      return;
    }

    setValidationNotice((prev) => ({ ...prev, [section]: null }));
    if (section === "comprehension") setCompSubmitted(true);
    if (section === "grammar") setGrammarSubmitted(true);
    if (section === "quiz") setQuizSubmitted(true);
  };

  const submitButtonStyle = (allAnswered: boolean): CSSProperties => ({
    fontFamily: theme.fonts.body,
    fontSize: "14px",
    fontWeight: 600,
    color: allAnswered ? theme.colors.accentInk : theme.colors.inkMuted,
    background: allAnswered ? theme.colors.accent : theme.colors.surface,
    border: `1px solid ${allAnswered ? theme.colors.accent : theme.colors.border}`,
    borderRadius: theme.radius.pill,
    padding: "12px 20px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: allAnswered ? theme.shadow.sm : "none",
  });

  const splitReadingIntoParagraphs = (text: string): string[] => {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) return [];

    const blocks = normalized.split(/\n\s*\n/).flatMap((block) => {
      const trimmed = block.trim();
      if (!trimmed) return [];
      if (trimmed.length <= 420) return [trimmed];

      const sentences = trimmed.match(/[^.!?]+[.!?]?/g) ?? [trimmed];
      const chunks: string[] = [];
      let current = "";

      for (const sentence of sentences) {
        const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
        if (next.length > 420 && current) {
          chunks.push(current);
          current = sentence.trim();
        } else {
          current = next;
        }
      }
      if (current) chunks.push(current);
      return chunks;
    });

    return blocks.length > 0 ? blocks : [normalized];
  };
  const readingParagraphs = splitReadingIntoParagraphs(lesson.reading_text);

  return (
    <div
      style={{
        background: "transparent",
        fontFamily: theme.fonts.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "transparent",
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: "20px 0 18px",
        }}
      >
        <div style={{ padding: `0 ${sectionPaddingX}` }}>
            <p
              style={{
                fontFamily: theme.fonts.body,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: theme.colors.accent,
                marginBottom: "8px",
              }}
            >
              Lesson
            </p>
            <h2
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(24px, 5vw, 28px)",
                fontWeight: 400,
                color: theme.colors.ink,
                lineHeight: 1.2,
                marginBottom: "10px",
              }}
            >
              {lesson.title}
            </h2>
            <p
              style={{
                fontFamily: theme.fonts.body,
                fontSize: "14px",
                color: theme.colors.inkMuted,
                lineHeight: 1.6,
                maxWidth: "640px",
              }}
            >
              {lesson.summary}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
                flexWrap: "wrap",
              }}
            >
              {lesson.objectives.map((obj, i) => (
                <span
                  key={i}
                  style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme.colors.accent,
                  background: theme.colors.accentSoft,
                    padding: "6px 12px",
                    borderRadius: theme.radius.pill,
                  }}
                >
                  {obj}
                </span>
              ))}
            </div>
        </div>
      </div>

      {/* Tabs */}
      <nav
        style={{
          background: "transparent",
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            padding: `0 ${sectionPaddingX}`,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            let dotColor: string | null = null;
            if (tab.id === "comprehension" && compScore)
              dotColor =
                compScore.correct === compScore.total
                  ? theme.colors.success
                  : theme.colors.warning;
            if (tab.id === "grammar" && grammarScore)
              dotColor =
                grammarScore.correct === grammarScore.total
                  ? theme.colors.success
                  : theme.colors.warning;
            if (tab.id === "quiz" && quizScore)
              dotColor =
                quizScore.correct === quizScore.total
                  ? theme.colors.success
                  : theme.colors.warning;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? theme.colors.accent : theme.colors.inkMuted,
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? theme.colors.accent : "transparent"}`,
                  padding: "12px 14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {tab.label}
                {dotColor && (
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: dotColor,
                      display: "inline-block",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div style={{ padding: `24px ${sectionPaddingX} 32px` }}>
        {/* Vocabulary */}
        {activeTab === "vocabulary" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontFamily: theme.fonts.display,
                  fontSize: "22px",
                  color: theme.colors.ink,
                  marginBottom: "6px",
                }}
              >
                Vocabulary
              </h3>
              <p
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "13px",
                  color: theme.colors.inkMuted,
                }}
              >
                Tap each card to reveal the definition.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {lesson.vocabulary.map((item, i) => (
                <VocabCard
                  key={i}
                  term={item.term}
                  definition={item.definition}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reading Text */}
        {activeTab === "reading" && (
          <div>
            <h3
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "22px",
                color: theme.colors.ink,
                marginBottom: "20px",
              }}
            >
              Reading Text
            </h3>
            <div
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `3px solid ${theme.colors.accent}`,
                borderRadius: theme.radius.md,
                padding: "32px",
                boxShadow: theme.shadow.sm,
              }}
            >
              {readingParagraphs.map((paragraph, idx) => (
                <p
                  key={`${idx}-${paragraph.slice(0, 24)}`}
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "15px",
                    color: theme.colors.ink,
                    lineHeight: 1.85,
                    letterSpacing: "0.01em",
                    marginBottom: idx === readingParagraphs.length - 1 ? 0 : "16px",
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Comprehension */}
        {activeTab === "comprehension" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: theme.fonts.display,
                    fontSize: "22px",
                    color: theme.colors.ink,
                    marginBottom: "6px",
                  }}
                >
                  Comprehension Questions
                </h3>
                <p
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "13px",
                    color: theme.colors.inkMuted,
                  }}
                >
                  Answer all questions, then submit to check your work.
                </p>
              </div>
            </div>

            {compScore && (
              <ScoreBanner
                correct={compScore.correct}
                total={compScore.total}
                onReset={() => resetSection("comprehension")}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {lesson.comprehension_questions.map((q, i) => (
                <div key={q.id} id={getQuestionAnchorId("comprehension", i + 1)}>
                  <QuestionCard
                    number={i + 1}
                    question={q.question}
                    options={q.options}
                    correctIndex={q.correct_index}
                    selectedAnswer={compAnswers[q.id] ?? null}
                    onSelect={(idx) => {
                      setCompAnswers((prev) => ({ ...prev, [q.id]: idx }));
                      setValidationNotice((prev) => ({ ...prev, comprehension: null }));
                    }}
                    submitted={compSubmitted}
                  />
                </div>
              ))}
            </div>

            {!compSubmitted && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                {validationNotice.comprehension ? (
                  <p
                    style={{
                      marginBottom: "10px",
                      fontFamily: theme.fonts.body,
                      fontSize: "13px",
                      color: theme.colors.danger,
                    }}
                  >
                    {validationNotice.comprehension}
                  </p>
                ) : null}
                <button
                  onClick={() => handleSectionSubmit("comprehension")}
                  style={submitButtonStyle(compAllAnswered)}
                >
                  Submit Answers
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grammar */}
        {activeTab === "grammar" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: theme.fonts.display,
                    fontSize: "22px",
                    color: theme.colors.ink,
                    marginBottom: "6px",
                  }}
                >
                  Grammar Exercises
                </h3>
              <p
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "13px",
                  color: theme.colors.inkMuted,
                }}
              >
                  Choose the best option for each grammar-focused question, then submit.
              </p>
            </div>
          </div>

            {grammarScore && (
              <ScoreBanner
                correct={grammarScore.correct}
                total={grammarScore.total}
                onReset={() => resetSection("grammar")}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {lesson.grammar_exercises.map((q, i) => (
                <div key={q.id} id={getQuestionAnchorId("grammar", i + 1)}>
                  <QuestionCard
                    number={i + 1}
                    question={q.question}
                    options={q.options}
                    correctIndex={q.correct_index}
                    instruction={q.instruction ?? ""}
                    sentence={q.sentence ?? q.question}
                    selectedAnswer={grammarAnswers[q.id] ?? null}
                    onSelect={(idx) => {
                      setGrammarAnswers((prev) => ({ ...prev, [q.id]: idx }));
                      setValidationNotice((prev) => ({ ...prev, grammar: null }));
                    }}
                    submitted={grammarSubmitted}
                  />
                </div>
              ))}
            </div>

            {!grammarSubmitted && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                {validationNotice.grammar ? (
                  <p
                    style={{
                      marginBottom: "10px",
                      fontFamily: theme.fonts.body,
                      fontSize: "13px",
                      color: theme.colors.danger,
                    }}
                  >
                    {validationNotice.grammar}
                  </p>
                ) : null}
                <button
                  onClick={() => handleSectionSubmit("grammar")}
                  style={submitButtonStyle(grammarAllAnswered)}
                >
                  Submit Answers
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Play */}
        {activeTab === "roleplay" && (
          <div>
            <h3
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "22px",
                color: theme.colors.ink,
                marginBottom: "20px",
              }}
            >
              Role Play Scenario
            </h3>
            <div
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderTop: `3px solid ${theme.colors.accent}`,
                borderRadius: theme.radius.md,
                padding: "32px",
                boxShadow: theme.shadow.sm,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme.colors.accent,
                  marginBottom: "16px",
                }}
              >
                Your Scenario
              </div>
              <p
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "15px",
                  color: theme.colors.ink,
                  lineHeight: 1.7,
                }}
              >
                {lesson.role_play}
              </p>
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px 20px",
                  background: theme.colors.accentSoft,
                  borderRadius: theme.radius.sm,
                  fontFamily: theme.fonts.body,
                  fontSize: "13px",
                  color: theme.colors.accent,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                Tip: Practice this scenario with a partner or use the AI
                Simulation to role play this conversation in real time.
              </div>
            </div>
          </div>
        )}

        {/* Quiz */}
        {activeTab === "quiz" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: theme.fonts.display,
                    fontSize: "22px",
                    color: theme.colors.ink,
                    marginBottom: "6px",
                  }}
                >
                  Quiz
                </h3>
                <p
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "13px",
                    color: theme.colors.inkMuted,
                  }}
                >
                  Test your understanding. Answer all questions, then submit.
                </p>
              </div>
            </div>

            {quizScore && (
              <ScoreBanner
                correct={quizScore.correct}
                total={quizScore.total}
                onReset={() => resetSection("quiz")}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {lesson.quiz.map((q, i) => (
                <div key={q.id} id={getQuestionAnchorId("quiz", i + 1)}>
                  <QuestionCard
                    number={i + 1}
                    question={q.question}
                    options={q.options}
                    correctIndex={q.correct_index}
                    selectedAnswer={quizAnswers[q.id] ?? null}
                    onSelect={(idx) => {
                      setQuizAnswers((prev) => ({ ...prev, [q.id]: idx }));
                      setValidationNotice((prev) => ({ ...prev, quiz: null }));
                    }}
                    submitted={quizSubmitted}
                  />
                </div>
              ))}
            </div>

            {!quizSubmitted && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                {validationNotice.quiz ? (
                  <p
                    style={{
                      marginBottom: "10px",
                      fontFamily: theme.fonts.body,
                      fontSize: "13px",
                      color: theme.colors.danger,
                    }}
                  >
                    {validationNotice.quiz}
                  </p>
                ) : null}
                <button
                  onClick={() => handleSectionSubmit("quiz")}
                  style={submitButtonStyle(quizAllAnswered)}
                >
                  Submit Answers
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
