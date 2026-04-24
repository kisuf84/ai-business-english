"use client";

import { useState, useCallback, useEffect, useMemo, type CSSProperties } from "react";
import type { LessonGenerationOutput, LessonQuestion } from "../../types/lesson";
import { useTheme } from "../../context/ThemeContext";
import VocabCard from "./VocabCard";
import QuestionCard from "./QuestionCard";
import ScoreBanner from "./ScoreBanner";

type Tab = {
  id: string;
  label: string;
};

const REQUIRED_TABS: Tab[] = [
  { id: "word_bank", label: "Word Bank" },
  { id: "reading", label: "Reading Text" },
  { id: "comprehension", label: "Reading Comprehension" },
  { id: "vocabulary_exercise", label: "Vocabulary Exercise" },
  { id: "grammar", label: "Grammar" },
  { id: "final_assessment", label: "Final Assessment" },
];

type QuestionSection =
  | "comprehension"
  | "vocabulary_exercise"
  | "grammar"
  | "final_assessment";

type AnswerMap = Record<string, number>;
type ValidationNoticeMap = Record<QuestionSection, string | null>;

type LessonViewerProps = {
  lesson: LessonGenerationOutput;
  videoId?: string | null;
  transcriptText?: string | null;
  transcriptSegments?: Array<{ start: number; duration?: number; text: string }> | null;
};

function formatMissingQuestionList(numbers: number[]) {
  if (numbers.length === 1) return String(numbers[0]);
  if (numbers.length === 2) return `${numbers[0]} and ${numbers[1]}`;
  return `${numbers.slice(0, -1).join(", ")}, and ${numbers[numbers.length - 1]}`;
}

function splitReadingIntoParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs;
  }

  return [normalized];
}

function getQuestionsBySection(lesson: LessonGenerationOutput): Record<QuestionSection, LessonQuestion[]> {
  return {
    comprehension: lesson.reading_comprehension,
    vocabulary_exercise: lesson.vocabulary_exercise,
    grammar: lesson.grammar,
    final_assessment: lesson.final_assessment,
  };
}

function extractProfessionalFocus(
  lesson: LessonGenerationOutput
): { profession: string | null; industry: string | null } {
  const haystack = [lesson.summary, ...lesson.objectives, lesson.reading_text]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  const professionMatch =
    haystack.match(/\bfor (?:a|an) ([a-z][a-z\s&/-]{2,50})/i) ??
    haystack.match(/\b(role|profession):\s*([a-z][a-z\s&/-]{2,50})/i);

  const industryMatch =
    haystack.match(/\bin (?:the )?([a-z][a-z\s&/-]{2,50}) industry\b/i) ??
    haystack.match(/\bindustry:\s*([a-z][a-z\s&/-]{2,50})/i);

  const rawProfession =
    professionMatch && professionMatch[1]
      ? professionMatch[1]
      : professionMatch && professionMatch[2]
        ? professionMatch[2]
        : null;
  const rawIndustry =
    industryMatch && industryMatch[1]
      ? industryMatch[1]
      : industryMatch && industryMatch[2]
        ? industryMatch[2]
        : null;

  const normalizeValue = (value: string | null) => {
    if (!value) return null;
    const cleaned = value
      .replace(/[.,;:!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < 2 || cleaned.length > 60) return null;
    return cleaned;
  };

  return {
    profession: normalizeValue(rawProfession),
    industry: normalizeValue(rawIndustry),
  };
}

function formatTimestamp(seconds: number): string {
  const clamped = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function sentenceCount(value: string): number {
  const matches = value.match(/[.!?]+(?=\s|$)/g);
  return matches ? matches.length : 0;
}

function splitPlainTranscriptParagraphs(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences =
    normalized.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((item) => item.trim()) ?? [];
  if (sentences.length === 0) return [normalized];

  const paragraphs: string[] = [];
  let buffer = "";
  let sentenceBuffer = 0;
  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}` : sentence;
    const nextSentences = sentenceBuffer + 1;
    const shouldFlush = candidate.length >= 680 || nextSentences >= 4;
    buffer = candidate;
    sentenceBuffer = nextSentences;
    if (shouldFlush) {
      paragraphs.push(buffer.trim());
      buffer = "";
      sentenceBuffer = 0;
    }
  }
  if (buffer.trim()) paragraphs.push(buffer.trim());
  return paragraphs;
}

function groupTranscriptSegments(
  segments: Array<{ start: number; duration?: number; text: string }>
): Array<{ start: number; text: string }> {
  const sorted = [...segments]
    .filter(
      (item) =>
        item &&
        Number.isFinite(item.start) &&
        item.start >= 0 &&
        typeof item.text === "string" &&
        item.text.trim().length > 0
    )
    .sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return [];

  const groups: Array<{ start: number; text: string }> = [];
  let current: Array<{ start: number; text: string }> = [];

  const flush = () => {
    if (current.length === 0) return;
    groups.push({
      start: current[0].start,
      text: current.map((item) => item.text.trim()).join(" ").replace(/\s+/g, " ").trim(),
    });
    current = [];
  };

  for (const segment of sorted) {
    const normalizedText = segment.text.replace(/\s+/g, " ").trim();
    if (!normalizedText) continue;
    if (current.length === 0) {
      current.push({ start: segment.start, text: normalizedText });
      continue;
    }

    const previous = current[current.length - 1];
    const candidateText = `${current.map((item) => item.text).join(" ")} ${normalizedText}`;
    const candidateChars = candidateText.length;
    const candidateSentences = sentenceCount(candidateText);
    const gap = Math.max(0, segment.start - previous.start);
    const maxedOut = candidateChars >= 760 || candidateSentences >= 5;
    const naturalBreak =
      (candidateChars >= 520 || candidateSentences >= 3) && gap > 18;

    if (maxedOut || naturalBreak) {
      flush();
      current.push({ start: segment.start, text: normalizedText });
      continue;
    }

    current.push({ start: segment.start, text: normalizedText });
  }

  flush();
  return groups;
}

export default function LessonViewer({
  lesson,
  videoId,
  transcriptText,
  transcriptSegments,
}: LessonViewerProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("word_bank");
  const sectionPaddingX = "clamp(16px, 4vw, 28px)";

  const [answers, setAnswers] = useState<Record<QuestionSection, AnswerMap>>({
    comprehension: {},
    vocabulary_exercise: {},
    grammar: {},
    final_assessment: {},
  });
  const [submitted, setSubmitted] = useState<Record<QuestionSection, boolean>>({
    comprehension: false,
    vocabulary_exercise: false,
    grammar: false,
    final_assessment: false,
  });
  const [validationNotice, setValidationNotice] = useState<ValidationNoticeMap>({
    comprehension: null,
    vocabulary_exercise: null,
    grammar: null,
    final_assessment: null,
  });

  const readingParagraphs = splitReadingIntoParagraphs(lesson.reading_text);
  const hasListening = Boolean(lesson.listening?.trim());
  const tabs: Tab[] = hasListening
    ? [...REQUIRED_TABS, { id: "listening", label: "Listening" }]
    : REQUIRED_TABS;
  const sectionQuestions = getQuestionsBySection(lesson);
  const professionalFocus = useMemo(() => extractProfessionalFocus(lesson), [lesson]);
  const hasProfessionalFocus = Boolean(
    professionalFocus.profession || professionalFocus.industry
  );
  const [transcriptStart, setTranscriptStart] = useState<number | null>(null);
  const hasVideo = typeof videoId === "string" && videoId.trim().length > 0;
  const normalizedVideoId = hasVideo ? videoId.trim() : null;
  const transcriptParagraphs = useMemo(() => {
    if (Array.isArray(transcriptSegments) && transcriptSegments.length > 0) {
      return groupTranscriptSegments(transcriptSegments).map((item) => ({
        ...item,
        clickable: hasVideo,
      }));
    }
    if (typeof transcriptText === "string" && transcriptText.trim().length > 0) {
      return splitPlainTranscriptParagraphs(transcriptText).map((text) => ({
        start: null as number | null,
        text,
        clickable: false,
      }));
    }
    return [];
  }, [hasVideo, transcriptSegments, transcriptText]);
  const videoEmbedSrc = useMemo(() => {
    if (!normalizedVideoId) return null;
    const params = new URLSearchParams();
    params.set("rel", "0");
    if (typeof transcriptStart === "number" && Number.isFinite(transcriptStart)) {
      params.set("start", String(Math.max(0, Math.floor(transcriptStart))));
    }
    return `https://www.youtube.com/embed/${normalizedVideoId}?${params.toString()}`;
  }, [normalizedVideoId, transcriptStart]);
  const schemaIssues = useMemo(() => {
    const issues: string[] = [];
    if (lesson.word_bank.length !== 12) {
      issues.push(`Word Bank count is ${lesson.word_bank.length}; expected 12.`);
    }
    if (readingParagraphs.length < 3) {
      issues.push(`Reading Text has ${readingParagraphs.length} paragraphs; expected at least 3.`);
    }
    if (lesson.reading_comprehension.length !== 8) {
      issues.push(
        `Reading Comprehension count is ${lesson.reading_comprehension.length}; expected 8.`
      );
    }
    if (lesson.vocabulary_exercise.length === 0) {
      issues.push("Vocabulary Exercise is missing.");
    }
    if (lesson.grammar.length !== 8) {
      issues.push(`Grammar count is ${lesson.grammar.length}; expected 8.`);
    }
    if (lesson.final_assessment.length < 15) {
      issues.push(
        `Final Assessment count is ${lesson.final_assessment.length}; expected at least 15.`
      );
    }
    return issues;
  }, [
    lesson.final_assessment.length,
    lesson.grammar.length,
    lesson.reading_comprehension.length,
    lesson.vocabulary_exercise.length,
    lesson.word_bank.length,
    readingParagraphs.length,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && schemaIssues.length > 0) {
      console.warn("[LessonViewer] Required lesson schema issues detected", schemaIssues);
    }
  }, [schemaIssues]);

  const computeScore = useCallback(
    (section: QuestionSection) => {
      if (!submitted[section]) return null;
      const questions = sectionQuestions[section];
      let correct = 0;
      questions.forEach((q) => {
        if (answers[section][q.id] === q.correct_index) {
          correct += 1;
        }
      });
      return { correct, total: questions.length };
    },
    [answers, sectionQuestions, submitted]
  );

  const sectionScores = {
    comprehension: useMemo(() => computeScore("comprehension"), [computeScore]),
    vocabulary_exercise: useMemo(
      () => computeScore("vocabulary_exercise"),
      [computeScore]
    ),
    grammar: useMemo(() => computeScore("grammar"), [computeScore]),
    final_assessment: useMemo(
      () => computeScore("final_assessment"),
      [computeScore]
    ),
  };

  const resetSection = useCallback((section: QuestionSection) => {
    setAnswers((prev) => ({ ...prev, [section]: {} }));
    setSubmitted((prev) => ({ ...prev, [section]: false }));
    setValidationNotice((prev) => ({ ...prev, [section]: null }));
  }, []);

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

  const submitSection = (section: QuestionSection) => {
    const questions = sectionQuestions[section];
    const missing = questions
      .map((q, index) => ({ id: q.id, number: index + 1 }))
      .filter((item) => answers[section][item.id] === undefined)
      .map((item) => item.number);

    if (missing.length > 0) {
      const message =
        missing.length === 1
          ? `Please answer Question ${missing[0]} before submitting.`
          : `You still need to answer Questions ${formatMissingQuestionList(missing)}.`;
      setValidationNotice((prev) => ({ ...prev, [section]: message }));
      scrollToFirstMissingQuestion(section, missing[0]);
      return;
    }

    setValidationNotice((prev) => ({ ...prev, [section]: null }));
    setSubmitted((prev) => ({ ...prev, [section]: true }));
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

  const renderQuestionSection = (
    section: QuestionSection,
    title: string,
    subtitle: string
  ) => {
    const questions = sectionQuestions[section];
    const sectionAnswers = answers[section];
    const allAnswered =
      questions.length > 0 &&
      questions.every((q) => sectionAnswers[q.id] !== undefined);
    const isSubmitted = submitted[section];
    const score = sectionScores[section];

    return (
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
              {title}
            </h3>
            <p
              style={{
                fontFamily: theme.fonts.body,
                fontSize: "13px",
                color: theme.colors.inkMuted,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {score ? (
          <ScoreBanner
            correct={score.correct}
            total={score.total}
            onReset={() => resetSection(section)}
          />
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {questions.map((q, index) => (
            <div key={q.id} id={getQuestionAnchorId(section, index + 1)}>
              <QuestionCard
                number={index + 1}
                question={q.question}
                options={q.options}
                correctIndex={q.correct_index}
                instruction={q.instruction ?? ""}
                sentence={q.sentence ?? q.question}
                selectedAnswer={sectionAnswers[q.id] ?? null}
                onSelect={(idx) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [section]: { ...prev[section], [q.id]: idx },
                  }));
                  setValidationNotice((prev) => ({ ...prev, [section]: null }));
                }}
                submitted={isSubmitted}
              />
            </div>
          ))}
        </div>

        {!isSubmitted ? (
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            {validationNotice[section] ? (
              <p
                style={{
                  marginBottom: "10px",
                  fontFamily: theme.fonts.body,
                  fontSize: "13px",
                  color: theme.colors.danger,
                }}
              >
                {validationNotice[section]}
              </p>
            ) : null}
            <button onClick={() => submitSection(section)} style={submitButtonStyle(allAnswered)}>
              Submit Answers
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      style={{
        background: "transparent",
        fontFamily: theme.fonts.body,
      }}
    >
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
              fontSize: "28px",
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
                key={`${i}-${obj}`}
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme.colors.accent,
                  background: theme.colors.accentSoft,
                  padding: "6px 14px",
                  borderRadius: theme.radius.pill,
                }}
              >
                {obj}
              </span>
            ))}
          </div>

          {hasProfessionalFocus ? (
            <div
              style={{
                marginTop: "18px",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: "14px 16px",
                background: theme.colors.surface,
              }}
            >
              <p
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: theme.colors.inkFaint,
                  marginBottom: "8px",
                }}
              >
                Professional Focus
              </p>
              {professionalFocus.profession ? (
                <p
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "14px",
                    color: theme.colors.ink,
                    lineHeight: 1.5,
                    marginBottom: professionalFocus.industry ? "4px" : 0,
                  }}
                >
                  Built for: {professionalFocus.profession}
                </p>
              ) : null}
              {professionalFocus.industry ? (
                <p
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "14px",
                    color: theme.colors.inkMuted,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Industry context: {professionalFocus.industry}
                </p>
              ) : null}
            </div>
          ) : null}

          {videoEmbedSrc ? (
            <div style={{ marginTop: "20px" }}>
              <p
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: theme.colors.inkFaint,
                  marginBottom: "10px",
                }}
              >
                Source Video
              </p>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  overflow: "hidden",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  background: "var(--surface-raised)",
                }}
              >
                <iframe
                  src={videoEmbedSrc}
                  title="Lesson video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "0",
                  }}
                />
              </div>

            </div>
          ) : null}

          {transcriptParagraphs.length > 0 ? (
            <div style={{ marginTop: "14px" }}>
              <details
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  background: theme.colors.surface,
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                    padding: "12px 14px",
                    fontFamily: theme.fonts.body,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: theme.colors.ink,
                    userSelect: "none",
                  }}
                >
                  Transcript
                </summary>
                <div
                  style={{
                    borderTop: `1px solid ${theme.colors.border}`,
                    padding: "12px 14px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {transcriptParagraphs.map((paragraph, index) => {
                    const key = `${index}-${paragraph.start ?? "plain"}`;
                    const clickable =
                      paragraph.clickable && typeof paragraph.start === "number";
                    const rowContent = (
                      <>
                        {typeof paragraph.start === "number" ? (
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: "52px",
                              marginRight: "8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              color: theme.colors.accent,
                            }}
                          >
                            {formatTimestamp(paragraph.start)}
                          </span>
                        ) : null}
                        <span
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: "13px",
                            lineHeight: 1.6,
                            color: theme.colors.inkMuted,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {paragraph.text}
                        </span>
                      </>
                    );

                    if (!clickable) {
                      return (
                        <div key={key} style={{ margin: 0 }}>
                          {rowContent}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTranscriptStart(paragraph.start)}
                        style={{
                          textAlign: "left",
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.radius.md,
                          background: theme.colors.surface,
                          padding: "10px 12px",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = theme.colors.accentSoft;
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = theme.colors.surface;
                        }}
                      >
                        {rowContent}
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          ) : null}
        </div>
      </div>

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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontFamily: theme.fonts.body,
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? theme.colors.accent : theme.colors.inkMuted,
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${
                  activeTab === tab.id ? theme.colors.accent : "transparent"
                }`,
                padding: "14px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ padding: `28px ${sectionPaddingX} 40px` }}>
        {activeTab === "word_bank" ? (
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
                Word Bank
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
              {lesson.word_bank.map((item, i) => (
                <VocabCard key={`${item.term}-${i}`} term={item.term} definition={item.definition} index={i} />
              ))}
            </div>
          </div>
        ) : null}

        {process.env.NODE_ENV !== "production" && schemaIssues.length > 0 ? (
          <div
            style={{
              marginBottom: "18px",
              border: `1px solid ${theme.colors.warning}`,
              borderRadius: theme.radius.sm,
              padding: "10px 14px",
              color: theme.colors.warning,
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            Schema warning: this lesson is missing required section constraints. Check console.
          </div>
        ) : null}

        {activeTab === "reading" ? (
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
        ) : null}

        {activeTab === "comprehension"
          ? renderQuestionSection(
              "comprehension",
              "Reading Comprehension",
              "Answer all questions, then submit to check your work."
            )
          : null}

        {activeTab === "vocabulary_exercise"
          ? renderQuestionSection(
              "vocabulary_exercise",
              "Vocabulary Exercise",
              "Use context from the reading and the word bank."
            )
          : null}

        {activeTab === "grammar"
          ? renderQuestionSection(
              "grammar",
              "Grammar",
              "Choose the best option for each grammar-focused question."
            )
          : null}

        {activeTab === "listening" && hasListening ? (
          <div>
            <h3
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "22px",
                color: theme.colors.ink,
                marginBottom: "20px",
              }}
            >
              Listening
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
              <p
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: "15px",
                  color: theme.colors.ink,
                  lineHeight: 1.7,
                }}
              >
                {lesson.listening}
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "final_assessment"
          ? renderQuestionSection(
              "final_assessment",
              "Final Assessment",
              "Complete the full assessment to validate lesson mastery."
            )
          : null}
      </div>
    </div>
  );
}
