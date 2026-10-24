import Link from "next/link";

const navigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({
  children,
  adminEmail,
}: {
  children: React.ReactNode;
  adminEmail: string;
}) {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#07111f] text-slate-100">
      <header className="border-b border-white/10 bg-[#0a1627]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/admin" className="text-xl font-extrabold tracking-tight text-white">
              Langslate Admin
            </Link>
            <p className="mt-1 text-xs text-slate-400">Read-only operations console</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="max-w-[210px] truncate">{adminEmail}</span>
            <Link className="rounded-full border border-white/15 px-3 py-2 font-semibold text-slate-200 hover:border-cyan-300/60" href="/dashboard">
              Back to app
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full min-w-0 max-w-[1600px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-white/10 px-4 py-3 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
          <nav className="flex gap-2 overflow-x-auto lg:grid" aria-label="Admin navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs leading-5 text-slate-400 lg:block">
            Mutations are intentionally disabled until the proposed database and storage policies are approved and applied.
          </div>
        </aside>

        <main className="min-w-0 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
