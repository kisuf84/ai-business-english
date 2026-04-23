import type { LessonGenerationOutput } from "../../types/lesson";

export function lessonToText(lesson: LessonGenerationOutput): string {
  return [
    `Title\n${lesson.title}`,
    `Summary\n${lesson.summary}`,
    `Objectives\n${lesson.objectives.map((item) => `- ${item}`).join("\n")}`,
    `Word Bank\n${lesson.word_bank.map((item) => `- ${item.term}: ${item.definition}`).join("\n")}`,
    `Reading Text\n${lesson.reading_text}`,
    `Reading Comprehension\n${lesson.reading_comprehension
      .map((q) => `- ${q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
    `Vocabulary Exercise\n${lesson.vocabulary_exercise
      .map((q) => `- ${q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
    `Grammar\n${lesson.grammar
      .map((q) => `- ${q.sentence ?? q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
    `Listening\n${lesson.listening}`,
    `Final Assessment\n${lesson.final_assessment
      .map((q) => `- ${q.question}\n  ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}`)
      .join("\n")}`,
  ].join("\n\n");
}
