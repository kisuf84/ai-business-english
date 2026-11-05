import { headers } from "next/headers";
import AuthGuard from "../../components/shared/AuthGuard";
import AppShell from "../../components/shared/AppShell";
import { getLangslateProductForHostname } from "../../lib/langslateDomains.mjs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const product = getLangslateProductForHostname(requestHeaders.get("host"));

  return (
    <AuthGuard>
      <AppShell product={product}>{children}</AppShell>
    </AuthGuard>
  );
}
