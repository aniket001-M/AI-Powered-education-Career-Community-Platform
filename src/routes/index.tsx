import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GitBranch, LineChart, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { adminMetrics, alumniStories } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerGraph — Career intelligence for institutions" },
      {
        name: "description",
        content:
          "One monochrome workspace where students, faculty, seniors and administrators read the same career signal.",
      },
      { property: "og:title", content: "CareerGraph — Career intelligence for institutions" },
      {
        property: "og:description",
        content:
          "Skill graphs, term roadmaps, matched opportunities and placement analytics in a single editorial workspace.",
      },
    ],
  }),
  component: Home,
});

const pillars = [
  {
    icon: GitBranch,
    title: "The graph, not the résumé",
    body: "Every student is modelled as a living skill graph — proficiency, demand and verification, term after term.",
  },
  {
    icon: LineChart,
    title: "Outcomes read in public",
    body: "Placement rate, readiness median and at-risk volume sit on one page, refreshed against the same definitions.",
  },
  {
    icon: Users,
    title: "Four rooms, one record",
    body: "Students, faculty, seniors and administration each get a workspace shaped to the decision they actually make.",
  },
];

function Home() {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="label-caps">Career intelligence · Est. 2026</p>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[1.05] md:text-7xl">
            Placement is a curriculum.
            <span className="italic"> Read it like one.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            CareerGraph turns four years of scattered coursework, projects and applications into a
            single legible record — so the gap between where a student is and where they are going
            stops being a guess.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/workspaces">
                Enter a workspace
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/platform">See the platform</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
          {adminMetrics.map((m) => (
            <div key={m.id} className="bg-background p-6">
              <p className="font-display text-4xl tabular-nums">{m.value}</p>
              <p className="label-caps mt-2">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-3xl md:text-4xl">
            Three commitments the interface never breaks
          </h2>
          <div className="mt-12 grid gap-px bg-border md:grid-cols-3">
            {pillars.map((p) => (
              <article key={p.title} className="bg-background p-7">
                <p.icon className="h-5 w-5" aria-hidden />
                <h3 className="mt-5 text-2xl">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">From the archive</p>
          <blockquote className="mt-6 max-w-3xl font-display text-3xl leading-snug md:text-4xl">
            “{alumniStories[0]!.quote}”
          </blockquote>
          <p className="mt-6 text-sm text-muted-foreground">
            {alumniStories[0]!.name} — {alumniStories[0]!.role}, {alumniStories[0]!.company}
          </p>
          <Link
            to="/stories"
            className="mt-8 inline-flex items-center gap-2 text-sm underline underline-offset-8"
          >
            Read every path
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-20 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl text-3xl md:text-4xl">
            Pick the room that matches your decision.
          </h2>
          <Button asChild size="lg">
            <Link to="/workspaces">
              Choose a workspace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
