import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Handshake, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/senior")({
  component: SeniorLayout,
});

function SeniorLayout() {
  return (
    <AppShell
      workspace="Senior workspace"
      person="Rhea Menon · Batch 2023"
      items={[
        { to: "/senior", label: "Overview", icon: LayoutDashboard },
        { to: "/senior/referrals", label: "Referrals", icon: Handshake },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
