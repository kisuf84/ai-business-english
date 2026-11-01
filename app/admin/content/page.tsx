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
          <div className="admin-table-wrap admin-section">
            <table className="admin-table admin-wide-table">
              <thead>
                <tr><th>Lesson</th><th>Level</th><th>Status</th><th>Created</th><th>Preview</th></tr>
              </thead>
              <tbody>
                {generated.lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td><strong>{lesson.title}</strong><span className="admin-block admin-muted admin-small">{lesson.topic}</span></td>
                    <td className="admin-nowrap">{lesson.level}</td>
                    <td><span className="admin-status">{lesson.status} · {lesson.visibility}</span></td>
                    <td className="admin-nowrap admin-muted">{lesson.created_at ? new Date(lesson.created_at).toLocaleDateString("en-US") : "Unknown"}</td>
                    <td><Link className="admin-table-link" href={`/lessons/${lesson.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <div className="admin-pagination admin-result-summary">
        <span>{filtered.length.toLocaleString()} matching items</span>
        <span>Read-only · publishing state is shown only where the source models it</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No content found" detail="Try another source or search term." />
      ) : (
        <div className="admin-content-list">
          {visible.map((item) => (
            <article key={item.id} className="admin-content-card">
              <div className="min-w-0">
                <div className="admin-content-tags">
                  <span className="admin-tag admin-tag-primary">{item.platform}</span>
                  <span className="admin-tag">{item.category}</span>
                  <span className="admin-tag">{item.availability}</span>
                </div>
                <h2>{item.title}</h2>
                <p className="admin-mono admin-wrap">{item.contentReference}</p>
                <p>Publishing: {item.publishing === "not-modelled" ? "not modelled" : item.publishing}</p>
                <div className="admin-health-check"><AdminContentHealthCheck id={item.id} /></div>
              </div>
              {item.previewHref ? (
                <Link className="admin-button" href={item.previewHref}>Preview</Link>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="admin-pagination" aria-label="Content pagination">
          {safePage > 1 ? <Link className="admin-button" href={filterHref(source, query, safePage - 1)}>Previous</Link> : <span />}
          <span>Page {safePage} of {pageCount}</span>
          {safePage < pageCount ? <Link className="admin-button" href={filterHref(source, query, safePage + 1)}>Next</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}

function ContentControls({ source, query }: { source: SourceFilter; query: string }) {
  return (
    <form className="admin-toolbar" action="/admin/content">
      <label className="admin-field admin-field-source">
        Source
        <select name="source" defaultValue={source} className="admin-select">
          <option value="all">All catalogues</option><option value="corporate">Corporate</option><option value="academy">Academy</option><option value="premium">Premium</option><option value="library">Other libraries</option><option value="generated">Generated lessons</option>
        </select>
      </label>
      <label className="admin-field admin-field-search">
        Search metadata
        <input name="q" defaultValue={query} maxLength={120} placeholder="Title, category, slug, or reference" className="admin-input" />
      </label>
      <button className="admin-button admin-button-primary" type="submit">Search</button>
    </form>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-empty"><h2>{title}</h2><p>{detail}</p></div>;
}
