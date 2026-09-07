import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BarChart3, LayoutDashboard, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AppShell
      workspace="Administration"
      person="Placement office"
      items={[
        { to: "/admin", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/students", label: "Student register", icon: Users },
        { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
