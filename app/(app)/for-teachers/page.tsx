import Link from "next/link";
import Card from "../../../components/shared/Card";
import { TEACHER_RESOURCES } from "../../../lib/forTeachersResources";
import { getGammaPreviewImage } from "../../../lib/gammaMetadata";

export const revalidate = 21600;

function toMonogram(title: string): string {
  const words = title
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return "GL";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

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
            Ready-to-use Gamma lesson resources for classroom and coaching sessions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resourcesWithPreview.map((resource) => {
            return (
              <Card key={resource.docsUrl} className="rounded-[20px] p-4 sm:rounded-3xl sm:p-5">
                <div className="flex h-full flex-col">
                  <h2 className="mobile-safe-wrap text-base font-semibold leading-snug text-[var(--ink)]">
                    {resource.title}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ink-faint)]">
                    Gamma lesson preview
                  </p>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]">
                    {resource.previewImageUrl ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <img
                          src={resource.previewImageUrl}
                          alt={`${resource.title} preview`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(8,12,24,0.82)] via-transparent to-[rgba(8,12,24,0.2)]" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 p-3">
                          <span className="inline-flex rounded-full border border-[rgba(232,193,91,0.36)] bg-[rgba(8,12,24,0.52)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                            Gamma Lesson
                          </span>
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                          <p className="line-clamp-1 text-xs font-medium text-[var(--ink)]">
                            {resource.title}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="relative aspect-[16/10] w-full overflow-hidden"
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

                        <div className="relative z-10 flex h-full flex-col justify-between p-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className="inline-flex rounded-full border border-[rgba(232,193,91,0.36)] bg-[rgba(8,12,24,0.44)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                              Gamma Lesson
                            </span>
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[rgba(232,193,91,0.38)] bg-[rgba(8,12,24,0.46)] text-xs font-bold text-[var(--ink)]">
                              {toMonogram(resource.title)}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                              Classroom resource
                            </p>
                            <p className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-[var(--ink)]">
                              {resource.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      href={`/for-teachers/${resource.id}`}
                      className="inline-flex w-full justify-center rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-[#0c0b0a] transition hover:bg-[#d4ad55] sm:w-auto"
                    >
                      Open Lesson
                    </Link>
                    <Link
                      href={resource.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent-gold)] sm:w-auto"
                    >
                      Open in Gamma
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
