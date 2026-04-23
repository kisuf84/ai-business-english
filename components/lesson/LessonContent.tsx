import type { LessonGenerationOutput } from "../../types/lesson";
import LessonSection from "./LessonSection";

type LessonContentProps = {
  lesson: LessonGenerationOutput;
};

export default function LessonContent({ lesson }: LessonContentProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <LessonSection title="Title">
        <p>{lesson.title}</p>
      </LessonSection>
      <LessonSection title="Summary">
        <p>{lesson.summary}</p>
      </LessonSection>
      <LessonSection title="Learning Objectives">
        <ul>
          {lesson.objectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Word Bank">
        <ul>
          {lesson.word_bank.map((item) => (
            <li key={item.term}>{item.term}: {item.definition}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Reading Text">
        <p>{lesson.reading_text}</p>
      </LessonSection>
      <LessonSection title="Reading Comprehension">
        <ul>
          {lesson.reading_comprehension.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Vocabulary Exercise">
        <ul>
          {lesson.vocabulary_exercise.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Grammar">
        <ul>
          {lesson.grammar.map((item) => (
            <li key={item.id}>{item.sentence ?? item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Final Assessment">
        <ul>
          {lesson.final_assessment.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
      {lesson.listening?.trim() ? (
        <LessonSection title="Listening">
          <p>{lesson.listening}</p>
        </LessonSection>
      ) : null}
    </div>
  );
}
