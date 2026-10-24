import Link from "next/link";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { getAdminCatalogSummary } from "../../lib/admin/contentCatalog";
import { getAdminDatabaseMetrics, type AdminMetric } from "../../lib/admin/data";

function MetricCard({ label, metric, detail }: { label: string; metric: AdminMetric | number; detail: string }) {
  const available = typeof metric === "number" || metric.status === "available";
  const value = typeof metric === "number" ? metric : available ? metric.value : "Unavailable";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold ${available ? "text-white" : "text-amber-300"}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Corporate lessons" metric={catalog.sourceCounts.corporate} detail="Migrated R2 catalog entries" />
        <MetricCard label="Academy lessons" metric={catalog.sourceCounts.academy} detail="Migrated R2 catalog entries" />
        <MetricCard label="Other catalog items" metric={catalog.sourceCounts.library + catalog.sourceCounts.premium} detail="Local libraries and premium modules" />
        <MetricCard label="Catalog groups" metric={catalog.categoryCount} detail={`${catalog.platformCount} platforms represented`} />
        <MetricCard label="Generated lessons" metric={database.lessons} detail="Live Supabase count when available" />
        <MetricCard label="Generated courses" metric={database.courses} detail="Live Supabase count when available" />
        <MetricCard label="Simulations" metric={database.simulations} detail="Live Supabase count when available" />
        <MetricCard label="Users" metric={database.users} detail="Supabase Auth count; no passwords or tokens exposed" />
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Application directory</h2>
          <p className="mt-1 text-sm text-slate-400">Open each platform on this application origin. Domain routing is not configured in this release.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { name: "Corporate", href: "/apps/corporate", description: "Industry, department, profession, and Pro lessons" },
            { name: "Academy", href: "/apps/academy", description: "Six levels of structured English lessons" },
            { name: "Flow", href: "/apps/flow", description: "Guided practice experience" },
            { name: "365", href: "/apps/365", description: "Daily learning experience" },
          ].map((app) => (
            <Link key={app.name} href={app.href} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition hover:border-cyan-300/40 hover:bg-white/[0.07]">
              <span className="text-base font-bold text-white">Langslate {app.name}</span>
              <span className="mt-2 block min-h-10 text-sm leading-5 text-slate-400">{app.description}</span>
              <span className="mt-4 inline-block text-xs font-bold text-cyan-300">Open platform →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-lg font-bold text-white">Content operations</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Browse metadata across R2-backed platforms, local HTML libraries, premium modules, and generated lessons. Existing content remains read-only.
          </p>
          <Link href="/admin/content" className="mt-5 inline-flex rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200">
            Open content explorer
          </Link>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-lg font-bold text-white">Progress reporting</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Corporate and Academy progress is stored in each browser and is not centralized. Aggregate progress reporting is therefore unavailable in this admin release.
          </p>
          <span className="mt-5 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200">
            Explicitly unavailable
          </span>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-lg font-bold text-white">Operational data boundaries</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="font-bold text-slate-200">Recent changes</dt><dd className="mt-1 leading-6 text-slate-500">Unavailable until the proposed audit log is approved and applied.</dd></div>
          <div><dt className="font-bold text-slate-200">Publishing state</dt><dd className="mt-1 leading-6 text-slate-500">Shown for premium and generated content; not modelled for migrated Corporate or Academy lessons.</dd></div>
          <div><dt className="font-bold text-slate-200">Content health</dt><dd className="mt-1 leading-6 text-slate-500">Checked on demand from the content explorer to avoid thousands of background requests.</dd></div>
        </dl>
      </section>
    </div>
  );
}
