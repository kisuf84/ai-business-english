import Link from "next/link";
import Card from "../../../components/shared/Card";
import { TEACHER_RESOURCES } from "../../../lib/forTeachersResources";
import { getGammaPreviewImage } from "../../../lib/gammaMetadata";

export const revalidate = 21600;

function variantFromTitle(title: string) {
  const variants = [
    {
      background:
        "linear-gradient(145deg,#0c2342 10%,#132f56 52%,#0a1a34 100%)",
      glowA: "rgba(232,193,91,0.16)",
      glowB: "rgba(232,193,91,0.12)",
    },
    {
      background:
        "linear-gradient(145deg,#102a4d 12%,#1a3a66 52%,#0d213f 100%)",
      glowA: "rgba(232,193,91,0.2)",
      glowB: "rgba(126,173,255,0.14)",
    },
    {
      background:
        "linear-gradient(145deg,#0b1f3d 6%,#19355d 52%,#122747 100%)",
      glowA: "rgba(232,193,91,0.14)",
      glowB: "rgba(106,198,255,0.12)",
    },
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return variants[hash % variants.length];
}

export default async function ForTeachersPage() {
  const resourcesWithPreview = await Promise.all(
    TEACHER_RESOURCES.map(async (resource, index) => ({
      ...resource,
      previewImageUrl: await getGammaPreviewImage(resource.docsUrl, {
        debug: process.env.NODE_ENV !== "production" && index < 3,
      }),
    }))
  );

  if (process.env.NODE_ENV !== "production") {
    resourcesWithPreview.slice(0, 3).forEach((resource) => {
      console.info("[ForTeachers] card_preview_input", {
        id: resource.id,
        docsUrl: resource.docsUrl,
        thumbnailUrl: resource.previewImageUrl,
        usingImagePreview: Boolean(resource.previewImageUrl),
      });
    });
  }

  return (
    <section className="mobile-page-shell py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Teacher Resources
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            For Teachers
          </h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            {resourcesWithPreview.length} ready-to-use lesson resources for classroom and coaching sessions.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resourcesWithPreview.map((resource) => {
            return (
              <Card key={resource.docsUrl} className="teacher-resource-card rounded-[20px] sm:rounded-3xl">
                <div className="flex h-full flex-col gap-4">
                  <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
                    {resource.previewImageUrl ? (
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <img
                          src={resource.previewImageUrl}
                          alt={`${resource.title} preview`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(8,12,24,0.28)] via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div
                        className="relative aspect-[4/3] w-full overflow-hidden"
                        style={{ background: variantFromTitle(resource.title).background }}
                      >
                        <div
                          className="absolute -left-10 -top-12 h-40 w-40 rounded-full blur-2xl"
                          style={{ background: variantFromTitle(resource.title).glowA }}
                        />
                        <div
                          className="absolute -bottom-16 right-0 h-48 w-48 rounded-full blur-3xl"
                          style={{ background: variantFromTitle(resource.title).glowB }}
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,193,91,0.22),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(232,193,91,0.16),transparent_30%)]" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-4">
                    <h2 className="mobile-safe-wrap text-base font-semibold leading-snug text-[var(--ink)]">
                      {resource.title}
                    </h2>
                    <Link
                      href={`/for-teachers/${resource.id}`}
                      className="inline-flex w-full justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55] sm:w-auto"
                    >
                      Open Lesson
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
