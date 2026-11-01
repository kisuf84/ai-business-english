import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { getOperationalSettings } from "../../../lib/admin/settings";

function Status({ ok }: { ok: boolean }) {
  return <span className={`admin-status ${ok ? "is-good" : "is-warning"}`}>{ok ? "Configured" : "Not configured"}</span>;
}

export default function AdminSettingsPage() {
  const settings = getOperationalSettings();
  const rows = [
    ["Supabase URL", <Status key="supabase-url" ok={settings.supabase.hasUrl} />, settings.supabase.urlHost || "No host exposed"],
    ["Supabase service role", <Status key="service-role" ok={settings.supabase.hasServiceRoleKey} />, "Server-only; value is never rendered"],
    ["OpenAI API", <Status key="openai" ok={settings.hasOpenAiKey} />, "Server-only; value is never rendered"],
    ["YouTube cron secret", <Status key="cron" ok={settings.hasCronSecret} />, "Required for job processor authorization"],
    ["R2 content host", <Status key="content" ok={Boolean(settings.contentHost)} />, settings.contentHost || "No host configured"],
    ["Thumbnail storage", <span key="storage" className="admin-status is-warning">Pending</span>, settings.thumbnailStorage],
    ["Admin mutations", <span key="mutations" className="admin-status">Disabled</span>, "Read-only foundation"],
  ] as const;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Settings"
        title="Operational configuration"
        description="A safe view of configuration presence and public host names. Secret values and private environment variables are never displayed."
      />
      <div className="admin-settings-list">
          {rows.map(([label, status, detail]) => (
            <div key={label} className="admin-settings-row">
              <strong>{label}</strong>
              <div>{status}</div>
              <span className="admin-settings-detail">{detail}</span>
            </div>
          ))}
      </div>

      <section className="admin-section admin-two-column">
        <article className="admin-panel">
          <div className="admin-panel-header"><h2>Administrator policy</h2></div>
          <div className="admin-panel-body">
          <p className="admin-muted">Default deny. Access is granted only by immutable user ID or trusted, server-managed Supabase app metadata role.</p>
          <dl className="admin-settings-facts"><div><dt>Configured user IDs</dt><dd>{settings.authorization.configuredUserIds}</dd></div><div><dt>Email-based access</dt><dd>Disabled</dd></div></dl>
          </div>
        </article>
        <article className="admin-panel">
          <div className="admin-panel-header"><h2>Content access policy</h2></div>
          <div className="admin-panel-body">
          <p className="admin-muted">Unchanged in this increment. The admin foundation does not alter existing lesson URLs, R2 objects, or entitlement behavior.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
