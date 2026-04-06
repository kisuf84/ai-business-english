import AppShell from "../../components/shared/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMPORARY DEMO BYPASS: remove for production and re-wrap AppShell with AuthGuard.
  return <AppShell>{children}</AppShell>;
}
