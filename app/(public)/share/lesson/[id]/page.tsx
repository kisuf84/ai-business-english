import LessonContent from "../../../../../components/lesson/LessonContent";
import { getLessonById } from "../../../../../lib/data/lessons";
import { normalizeLessonOutput } from "../../../../../lib/validators/lesson";

export default async function SharedLessonPage({
  params,
}: {
  params: { id: string };
}) {
  let lessonRecord = null;
  let error: string | null = null;

  try {
    lessonRecord = await getLessonById(params.id);
  } catch {
    error = "This lesson is unavailable.";
  }

  if (!lessonRecord || lessonRecord.visibility !== "public") {
    return (
      <section>
        <h1>Lesson Unavailable</h1>
        <p>This lesson is not available to view.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>{lessonRecord.title}</h1>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {(() => {
        const strictCheck = normalizeLessonOutput(lessonRecord.content_json, {
          strict: true,
        });
        const normalized = normalizeLessonOutput(lessonRecord.content_json, {
          strict: false,
          allowLegacyFields: true,
        });
        if (process.env.NODE_ENV !== "production" && !strictCheck.ok) {
          console.warn(
            "[SharedLessonPage] Lesson schema issues detected",
            strictCheck.errors
          );
        }
        if (!normalized.ok) {
          return <p>This lesson content is unavailable.</p>;
        }
        return (
          <>
            {process.env.NODE_ENV !== "production" && !strictCheck.ok ? (
              <p style={{ color: "crimson" }}>
                Dev note: required lesson schema checks failed for this shared lesson.
              </p>
            ) : null}
            <LessonContent lesson={normalized.data} />
          </>
        );
      })()}
    </section>
  );
}
