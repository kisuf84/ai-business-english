import Link from "next/link";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { listAdminUsers } from "../../../lib/admin/data";

const PER_PAGE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawPage = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const parsedPage = Number(rawPage);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rawQuery = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q;
  const query = (rawQuery || "").trim().slice(0, 120);
  const result = await listAdminUsers(page, PER_PAGE, query);
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `/admin/users?${suffix}` : "/admin/users";
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Users"
        title="User accounts"
        description="A minimal, read-only Supabase Auth directory. Passwords, sessions, tokens, and destructive account controls are never exposed."
      />

      <form action="/admin/users" className="admin-toolbar admin-user-search">
        <label className="admin-field admin-field-search">
          Search users
          <input name="q" defaultValue={query} maxLength={120} placeholder="Search email or user ID" className="admin-input" />
        </label>
        <button type="submit" className="admin-button admin-button-primary">Search</button>
      </form>

      {result.status === "unavailable" ? (
        <div className="admin-notice is-warning">
          <h2>User listing unavailable</h2>
          <p>{result.reason}</p>
        </div>
      ) : (
        <>
          <div className="admin-pagination admin-result-summary">
            <span>{result.total.toLocaleString()} accounts</span>
            <span>{query ? `Search: ${query}` : `Page ${page}`}</span>
          </div>
          {result.searchTruncated ? <p className="admin-notice is-warning">Search reached the 5,000-account safety cap. Narrow the query for a complete result.</p> : null}
          <div className="admin-table-wrap">
              <table className="admin-table admin-wide-table">
                <thead>
                  <tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Last sign-in</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody>
                  {result.users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.email || "No email"}</strong><span className="admin-block admin-mono admin-small admin-muted">{user.id}</span></td>
                      <td>{user.role || "user"}</td>
                      <td className="admin-nowrap admin-muted">{new Date(user.created_at).toLocaleDateString("en-US")}</td>
                      <td className="admin-nowrap admin-muted">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("en-US") : "Never"}</td>
                      <td><span className={`admin-status ${user.email_confirmed_at ? "is-good" : "is-warning"}`}>{user.email_confirmed_at ? "Confirmed" : "Unconfirmed"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          <nav className="admin-pagination" aria-label="User pagination">
            {page > 1 ? <Link className="admin-button" href={pageHref(page - 1)}>Previous</Link> : <span />}
            <span>Page {page} of {Math.max(1, Math.ceil(result.total / PER_PAGE))}</span>
            {page * PER_PAGE < result.total ? <Link className="admin-button" href={pageHref(page + 1)}>Next</Link> : <span />}
          </nav>
        </>
      )}

      <div className="admin-notice admin-section">
        Enrollment and Corporate/Academy progress are unavailable because those data are not centralized in the current architecture.
      </div>
    </div>
  );
}
