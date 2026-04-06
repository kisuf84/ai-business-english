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
      <LessonSection title="Vocabulary">
        <ul>
          {lesson.vocabulary.map((item) => (
            <li key={item.term}>{item.term}: {item.definition}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Reading Text">
        <p>{lesson.reading_text}</p>
      </LessonSection>
      <LessonSection title="Comprehension Questions">
        <ul>
          {lesson.comprehension_questions.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Grammar Exercises">
        <ul>
          {lesson.grammar_exercises.map((item) => (
            <li key={item.id}>{item.sentence ?? item.question}</li>
          ))}
        </ul>
      </LessonSection>
      <LessonSection title="Role Play Scenario">
        <p>{lesson.role_play}</p>
      </LessonSection>
      <LessonSection title="Quiz">
        <ul>
          {lesson.quiz.map((item) => (
            <li key={item.id}>{item.question}</li>
          ))}
        </ul>
      </LessonSection>
    </div>
  );
}
