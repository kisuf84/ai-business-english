import { redirect } from "next/navigation";
import AdminShell from "../../components/admin/AdminShell";
import { getServerAdminAuth } from "../../lib/admin/serverAuth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getServerAdminAuth();

  if (auth.status === "unauthenticated" || auth.status === "unconfigured") {
    redirect("/auth?next=%2Fadmin");
  }

  if (auth.status === "forbidden") {
    redirect("/dashboard?admin=forbidden");
  }

  return (
    <AdminShell adminEmail={auth.user.email || auth.user.id}>
      {children}
    </AdminShell>
  );
}
