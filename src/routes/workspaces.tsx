import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Landmark, ShieldCheck, UserRound } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/workspaces")({
  head: () => ({
    meta: [
      { title: "Workspaces — CareerGraph" },
      {
        name: "description",
        content:
          "Enter the student, faculty, senior or administration workspace. No sign-in required in this demonstration build.",
      },
      { property: "og:title", content: "Workspaces — CareerGraph" },
      {
        property: "og:description",
        content: "Four rooms shaped to four different decisions, reading one shared record.",
      },
    ],
  }),
  component: Workspaces,
});

const rooms = [
  {
    to: "/student",
    icon: GraduationCap,
    title: "Student",
    person: "Aniket Ghosh · CSE 2027",
    body: "Your graph, roadmap, matched roles and application ledger.",
  },
  {
    to: "/faculty",
    icon: UserRound,
    title: "Faculty",
    person: "Dr. Meera Iyer · Mentor",
    body: "Mentee readiness, pending reviews and escalations.",
  },
  {
    to: "/senior",
    icon: ShieldCheck,
    title: "Senior",
    person: "Rhea Menon · Batch 2023",
    body: "Referral requests, conversions and mentoring load.",
  },
  {
    to: "/admin",
    icon: Landmark,
    title: "Administration",
    person: "Placement office",
    body: "Cohort analytics, student register and at-risk tracking.",
  },
] as const;

function Workspaces() {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">Workspaces</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.08] md:text-6xl">Choose a room.</h1>
          <p className="mt-6 max-w-xl text-sm text-muted-foreground">
            This demonstration has no sign-in. Selecting a workspace loads that role with mock data.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-px bg-border md:grid-cols-2">
          {rooms.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group flex flex-col justify-between bg-background p-8 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground md:p-12"
            >
              <div>
                <r.icon className="h-5 w-5" aria-hidden />
                <h2 className="mt-6 text-3xl">{r.title}</h2>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{r.person}</p>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
              </div>
              <span className="mt-10 inline-flex items-center gap-2 text-sm underline underline-offset-8">
                Enter
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
