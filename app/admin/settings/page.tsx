import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { getOperationalSettings } from "../../../lib/admin/settings";

function Status({ ok }: { ok: boolean }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${ok ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{ok ? "Configured" : "Not configured"}</span>;
}

export default function AdminSettingsPage() {
  const settings = getOperationalSettings();
  const rows = [
    ["Supabase URL", <Status key="supabase-url" ok={settings.supabase.hasUrl} />, settings.supabase.urlHost || "No host exposed"],
    ["Supabase service role", <Status key="service-role" ok={settings.supabase.hasServiceRoleKey} />, "Server-only; value is never rendered"],
    ["OpenAI API", <Status key="openai" ok={settings.hasOpenAiKey} />, "Server-only; value is never rendered"],
    ["YouTube cron secret", <Status key="cron" ok={settings.hasCronSecret} />, "Required for job processor authorization"],
    ["R2 content host", <Status key="content" ok={Boolean(settings.contentHost)} />, settings.contentHost || "No host configured"],
    ["Thumbnail storage", <span key="storage" className="text-amber-200">Pending</span>, settings.thumbnailStorage],
    ["Admin mutations", <span key="mutations" className="text-slate-300">Disabled</span>, "Read-only foundation"],
  ] as const;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Settings"
        title="Operational configuration"
        description="A safe view of configuration presence and public host names. Secret values and private environment variables are never displayed."
      />
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="divide-y divide-white/10 bg-white/[0.03]">
          {rows.map(([label, status, detail]) => (
            <div key={label} className="grid gap-2 px-5 py-4 sm:grid-cols-[220px_140px_minmax(0,1fr)] sm:items-center">
              <strong className="text-sm text-white">{label}</strong>
              <div>{status}</div>
              <span className="break-all text-xs text-slate-500">{detail}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="font-bold text-white">Administrator policy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Default deny. Access is granted only by immutable user ID or trusted, server-managed Supabase app metadata role.</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">Configured user IDs</dt><dd className="mt-1 text-white">{settings.authorization.configuredUserIds}</dd></div><div><dt className="text-slate-500">Email-based access</dt><dd className="mt-1 text-white">Disabled</dd></div></dl>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="font-bold text-white">Content access policy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Unchanged in this increment. The admin foundation does not alter existing lesson URLs, R2 objects, or entitlement behavior.</p>
        </article>
      </section>
    </div>
  );
}
