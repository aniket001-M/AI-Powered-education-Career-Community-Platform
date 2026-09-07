import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/faculty")({
  component: FacultyLayout,
});

function FacultyLayout() {
  return (
    <AppShell
      workspace="Faculty workspace"
      person="Dr. Meera Iyer · Mentor"
      items={[
        { to: "/faculty", label: "Overview", icon: LayoutDashboard },
        { to: "/faculty/mentees", label: "Mentees", icon: Users },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
