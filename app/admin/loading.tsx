export default function AdminLoading() {
  return (
    <div className="admin-panel admin-panel-body" role="status" aria-live="polite">
      <div className="admin-skeleton" style={{ width: "36%" }} />
      <p className="admin-muted">Loading admin data…</p>
    </div>
  );
}
