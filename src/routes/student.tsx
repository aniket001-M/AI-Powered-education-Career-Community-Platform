import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Briefcase,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Route as RouteIcon,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <AppShell
      workspace="Student workspace"
      person="Aniket Ghosh · CSE 2027"
      items={[
        { to: "/student", label: "Overview", icon: LayoutDashboard },
        { to: "/student/roadmap", label: "Roadmap", icon: RouteIcon },
        { to: "/student/skills", label: "Skill graph", icon: GitBranch },
        { to: "/student/opportunities", label: "Opportunities", icon: Briefcase },
        { to: "/student/applications", label: "Applications", icon: ListChecks },
        { to: "/student/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
