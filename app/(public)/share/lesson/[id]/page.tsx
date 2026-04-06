import LessonContent from "../../../../../components/lesson/LessonContent";
import { getLessonById } from "../../../../../lib/data/lessons";

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
      <LessonContent lesson={lessonRecord.content_json} />
    </section>
  );
}
