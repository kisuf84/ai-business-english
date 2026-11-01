import Link from "next/link";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { getAdminCatalogSummary } from "../../lib/admin/contentCatalog";
import { getAdminDatabaseMetrics, type AdminMetric } from "../../lib/admin/data";

function MetricCard({ label, metric, detail }: { label: string; metric: AdminMetric | number; detail: string }) {
  const available = typeof metric === "number" || metric.status === "available";
  const value = typeof metric === "number" ? metric : available ? metric.value : "Unavailable";

  return (
    <article className="admin-kpi">
      <p className="admin-kpi-label">{label}</p>
      <p className={`admin-kpi-value${available ? "" : " is-unavailable"}`}>{value}</p>
      <p className="admin-kpi-detail">{detail}</p>
    </article>
  );
}

export default async function AdminOverviewPage() {
  const [catalog, database] = await Promise.all([
    getAdminCatalogSummary(),
    getAdminDatabaseMetrics(),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Operational snapshot"
        description="Verified catalog totals and live Supabase counts where the configured schema supports them. Unavailable data is labelled rather than inferred."
      />

      <section className="admin-kpi-grid" aria-label="Operational metrics">
        <MetricCard label="Corporate lessons" metric={catalog.sourceCounts.corporate} detail="Migrated R2 catalog entries" />
        <MetricCard label="Academy lessons" metric={catalog.sourceCounts.academy} detail="Migrated R2 catalog entries" />
        <MetricCard label="Other catalog items" metric={catalog.sourceCounts.library + catalog.sourceCounts.premium} detail="Local libraries and premium modules" />
        <MetricCard label="Catalog groups" metric={catalog.categoryCount} detail={`${catalog.platformCount} platforms represented`} />
        <MetricCard label="Generated lessons" metric={database.lessons} detail="Live Supabase count when available" />
        <MetricCard label="Generated courses" metric={database.courses} detail="Live Supabase count when available" />
        <MetricCard label="Simulations" metric={database.simulations} detail="Live Supabase count when available" />
        <MetricCard label="Users" metric={database.users} detail="Supabase Auth count; no passwords or tokens exposed" />
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Application directory</h2>
          <p>Open each platform on this application origin. Domain routing is not configured in this release.</p>
        </div>
        <div className="admin-app-grid">
          {[
            { name: "Corporate", href: "/apps/corporate", description: "Industry, department, profession, and Pro lessons" },
            { name: "Academy", href: "/apps/academy", description: "Six levels of structured English lessons" },
            { name: "Flow", href: "/apps/flow", description: "Guided practice experience" },
            { name: "365", href: "/apps/365", description: "Daily learning experience" },
          ].map((app) => (
            <Link key={app.name} href={app.href} className="admin-app-card">
              <strong>Langslate {app.name}</strong>
              <span>{app.description}</span>
              <span className="admin-app-open">Open platform →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-section admin-two-column">
        <article className="admin-panel">
          <div className="admin-panel-header"><h2>Content operations</h2></div>
          <div className="admin-panel-body">
          <p className="admin-muted">
            Browse metadata across R2-backed platforms, local HTML libraries, premium modules, and generated lessons. Existing content remains read-only.
          </p>
          <Link href="/admin/content" className="admin-button admin-button-primary">
            Open content explorer
          </Link>
          </div>
        </article>
        <article className="admin-panel">
          <div className="admin-panel-header"><h2>Progress reporting</h2></div>
          <div className="admin-panel-body">
          <p className="admin-muted">
            Corporate and Academy progress is stored in each browser and is not centralized. Aggregate progress reporting is therefore unavailable in this admin release.
          </p>
          <span className="admin-status is-warning">
            Explicitly unavailable
          </span>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-section">
        <div className="admin-panel-header"><h2>Operational data boundaries</h2></div>
        <div className="admin-panel-body">
        <dl className="admin-info-grid">
          <div><dt>Recent changes</dt><dd>Unavailable until the proposed audit log is approved and applied.</dd></div>
          <div><dt>Publishing state</dt><dd>Shown for premium and generated content; not modelled for migrated Corporate or Academy lessons.</dd></div>
          <div><dt>Content health</dt><dd>Checked on demand from the content explorer to avoid thousands of background requests.</dd></div>
        </dl>
        </div>
      </section>
    </div>
  );
}
