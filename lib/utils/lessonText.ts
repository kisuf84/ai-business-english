import type { LessonGenerationOutput } from "../../types/lesson";

export function lessonToText(lesson: LessonGenerationOutput): string {
  return [
    `Title\n${lesson.title}`,
    `Summary\n${lesson.summary}`,
    `Objectives\n${lesson.objectives.map((item) => `- ${item}`).join("\n")}`,
    `Vocabulary\n${lesson.vocabulary.map((item) => `- ${item.term}: ${item.definition}`).join("\n")}`,
    `Reading Text\n${lesson.reading_text}`,
    `Comprehension Questions\n${lesson.comprehension_questions
      .map((q) => `- ${q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
    `Grammar Exercises\n${lesson.grammar_exercises
      .map((q) => `- ${q.sentence ?? q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
    `Role Play\n${lesson.role_play}`,
    `Quiz\n${lesson.quiz
      .map((q) => `- ${q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
  ].join("\n\n");
}
