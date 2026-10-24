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

      <form action="/admin/users" className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row">
        <input name="q" defaultValue={query} maxLength={120} placeholder="Search email or user ID" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0d1b2d] px-4 py-3 text-sm text-white placeholder:text-slate-600" />
        <button type="submit" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950">Search users</button>
      </form>

      {result.status === "unavailable" ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-6">
          <h2 className="font-bold text-amber-100">User listing unavailable</h2>
          <p className="mt-2 text-sm text-amber-100/70">{result.reason}</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
            <span>{result.total.toLocaleString()} accounts</span>
            <span>{query ? `Search: ${query}` : `Page ${page}`}</span>
          </div>
          {result.searchTruncated ? <p className="mb-4 text-xs text-amber-200">Search reached the 5,000-account safety cap. Narrow the query for a complete result.</p> : null}
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.055] text-xs uppercase tracking-wider text-slate-400">
                  <tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Last sign-in</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/[0.025]">
                  {result.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4"><strong className="block text-white">{user.email || "No email"}</strong><span className="mt-1 block font-mono text-[11px] text-slate-600">{user.id}</span></td>
                      <td className="px-4 py-4 text-slate-300">{user.role || "user"}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-400">{new Date(user.created_at).toLocaleDateString("en-US")}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-400">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("en-US") : "Never"}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${user.email_confirmed_at ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{user.email_confirmed_at ? "Confirmed" : "Unconfirmed"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <nav className="mt-6 flex justify-between" aria-label="User pagination">
            {page > 1 ? <Link className="rounded-full border border-white/15 px-4 py-2 text-sm" href={pageHref(page - 1)}>Previous</Link> : <span />}
            {page * PER_PAGE < result.total ? <Link className="rounded-full border border-white/15 px-4 py-2 text-sm" href={pageHref(page + 1)}>Next</Link> : <span />}
          </nav>
        </>
      )}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-400">
        Enrollment and Corporate/Academy progress are unavailable because those data are not centralized in the current architecture.
      </div>
    </div>
  );
}
