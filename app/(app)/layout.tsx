import { headers } from "next/headers";
import AuthGuard from "../../components/shared/AuthGuard";
import AppShell from "../../components/shared/AppShell";
import { getProductShellMode } from "../../lib/langslateDomains.mjs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const hostname = requestHeaders.get("host");

  return (
    <AuthGuard>
      {getProductShellMode(hostname) === "standalone" ? (
        <div className="product-domain-experience">{children}</div>
      ) : (
        <AppShell product={null}>{children}</AppShell>
      )}
    </AuthGuard>
  );
}
