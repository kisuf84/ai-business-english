import type { LessonGenerationOutput } from "../../types/lesson";
import LessonSection from "./LessonSection";

type LessonContentProps = {
  lesson: LessonGenerationOutput;
};

export default function LessonContent({ lesson }: LessonContentProps) {
  return (
    <div className="mt-6 grid gap-4">
      <LessonSection title="Title">
        <p>{lesson.title}</p>
      </LessonSection>
      <LessonSection title="Summary">
        <p>{lesson.summary}</p>
      </LessonSection>
      <LessonSection title="Learning Objectives">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.objectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Word Bank">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.word_bank.map((item) => (
            <li key={item.term}>{item.term}: {item.definition}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Reading Text">
        <p className="whitespace-pre-wrap">{lesson.reading_text}</p>
      </LessonSection>
      <LessonSection title="Reading Comprehension">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.reading_comprehension.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Vocabulary Exercise">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.vocabulary_exercise.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Grammar">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.grammar.map((item) => (
            <li key={item.id}>{item.sentence ?? item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Final Assessment">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.final_assessment.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
    </div>
  );
}
