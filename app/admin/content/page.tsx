import Link from "next/link";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import {
  listAdminContentCatalog,
  type AdminContentSource,
} from "../../../lib/admin/contentCatalog";
import { listGeneratedLessons } from "../../../lib/admin/data";
import AdminContentHealthCheck from "../../../components/admin/AdminContentHealthCheck";

const PAGE_SIZE = 50;
const sources = ["all", "corporate", "academy", "premium", "library", "generated"] as const;
type SourceFilter = (typeof sources)[number];

function readSource(value: string | string[] | undefined): SourceFilter {
  const normalized = Array.isArray(value) ? value[0] : value;
  return sources.includes(normalized as SourceFilter) ? (normalized as SourceFilter) : "all";
}

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function filterHref(source: SourceFilter, query: string, page = 1) {
  const params = new URLSearchParams();
  if (source !== "all") params.set("source", source);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/admin/content?${suffix}` : "/admin/content";
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string | string[]; q?: string | string[]; page?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const source = readSource(resolvedSearchParams.source);
  const rawQuery = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q;
  const query = (rawQuery || "").trim().slice(0, 120);
  const page = readPage(resolvedSearchParams.page);
  const normalizedQuery = query.toLowerCase();

  if (source === "generated") {
    const generated = await listGeneratedLessons(query);
    return (
      <div>
        <AdminPageHeader eyebrow="Content" title="Content explorer" description="Inspect generated lesson metadata. This view does not change lesson content or visibility." />
        <ContentControls source={source} query={query} />
        {generated.status === "unavailable" ? (
          <EmptyState title="Generated lessons unavailable" detail={generated.reason} />
        ) : generated.lessons.length === 0 ? (
          <EmptyState title="No generated lessons found" detail="Try another search." />
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.055] text-xs uppercase tracking-wider text-slate-400">
                  <tr><th className="px-4 py-3">Lesson</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Preview</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/[0.025]">
                  {generated.lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td className="px-4 py-4"><strong className="block text-white">{lesson.title}</strong><span className="mt-1 block max-w-md truncate text-xs text-slate-500">{lesson.topic}</span></td>
                      <td className="px-4 py-4 text-slate-300">{lesson.level}</td>
                      <td className="px-4 py-4"><span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">{lesson.status} · {lesson.visibility}</span></td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-400">{lesson.created_at ? new Date(lesson.created_at).toLocaleDateString("en-US") : "Unknown"}</td>
                      <td className="px-4 py-4"><Link className="font-semibold text-cyan-300 hover:text-cyan-200" href={`/lessons/${lesson.id}`}>Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  const catalog = await listAdminContentCatalog();
  const filtered = catalog.filter((item) => {
    if (source !== "all" && item.source !== (source as AdminContentSource)) return false;
    if (!normalizedQuery) return true;
    return [item.title, item.platform, item.category, item.slug, item.contentReference]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Content explorer"
        description="Search the catalog, inspect source references, and open existing previews. “Catalogued” means a metadata reference exists; it is not a live R2 health check."
      />
      <ContentControls source={source} query={query} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>{filtered.length.toLocaleString()} matching items</span>
        <span>Read-only · publishing state is shown only where the source models it</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No content found" detail="Try another source or search term." />
      ) : (
        <div className="mt-4 grid gap-3">
          {visible.map((item) => (
            <article key={item.id} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
                  <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-cyan-200">{item.platform}</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-slate-400">{item.category}</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-slate-400">{item.availability}</span>
                </div>
                <h2 className="mt-3 font-bold text-white">{item.title}</h2>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.contentReference}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Publishing: {item.publishing === "not-modelled" ? "not modelled" : item.publishing}
                </p>
                <div className="mt-3"><AdminContentHealthCheck id={item.id} /></div>
              </div>
              {item.previewHref ? (
                <Link className="justify-self-start rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 hover:border-cyan-300/60 hover:text-white" href={item.previewHref}>
                  Preview
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-6 flex items-center justify-between" aria-label="Content pagination">
          {safePage > 1 ? <Link className="rounded-full border border-white/15 px-4 py-2 text-sm" href={filterHref(source, query, safePage - 1)}>Previous</Link> : <span />}
          <span className="text-xs text-slate-400">Page {safePage} of {pageCount}</span>
          {safePage < pageCount ? <Link className="rounded-full border border-white/15 px-4 py-2 text-sm" href={filterHref(source, query, safePage + 1)}>Next</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}

function ContentControls({ source, query }: { source: SourceFilter; query: string }) {
  return (
    <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[180px_minmax(0,1fr)_auto]" action="/admin/content">
      <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        Source
        <select name="source" defaultValue={source} className="rounded-xl border border-white/10 bg-[#0d1b2d] px-3 py-3 text-sm normal-case tracking-normal text-white">
          <option value="all">All catalogues</option><option value="corporate">Corporate</option><option value="academy">Academy</option><option value="premium">Premium</option><option value="library">Other libraries</option><option value="generated">Generated lessons</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        Search metadata
        <input name="q" defaultValue={query} maxLength={120} placeholder="Title, category, slug, or reference" className="rounded-xl border border-white/10 bg-[#0d1b2d] px-3 py-3 text-sm normal-case tracking-normal text-white placeholder:text-slate-600" />
      </label>
      <button className="self-end rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-cyan-200" type="submit">Search</button>
    </form>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center"><h2 className="font-bold text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{detail}</p></div>;
}
