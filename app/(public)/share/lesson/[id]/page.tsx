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

  const lessonVideoId =
    typeof (lessonRecord as { video_id?: unknown }).video_id === "string"
      ? (((lessonRecord as { video_id?: string | null }).video_id || "").trim() || null)
      : null;

  return (
    <section>
      <h1>{lessonRecord.title}</h1>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {lessonVideoId ? (
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
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
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface-raised)",
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${lessonVideoId}?rel=0`}
              title="Lesson video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "0" }}
            />
          </div>
        </div>
      ) : null}
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
