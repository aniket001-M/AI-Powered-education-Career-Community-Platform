import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CareerGraph" },
      {
        name: "description",
        content:
          "Why CareerGraph exists: one shared definition of career readiness across students, faculty, seniors and administration.",
      },
      { property: "og:title", content: "About — CareerGraph" },
      {
        property: "og:description",
        content: "The principles, the method and the people behind the CareerGraph record.",
      },
    ],
  }),
  component: About,
});

const principles: [string, string, string][] = [
  ["01", "One definition", "Readiness means the same thing in a student's dashboard and in the board report. No parallel numbers."],
  ["02", "Evidence over claims", "A skill counts when it has been assessed, reviewed or shipped. Everything else is marked unverified."],
  ["03", "Legible by default", "Strict monochrome, generous rules, no decoration that carries no information."],
  ["04", "Slow signals matter", "Term-scale movement is the unit of progress, not weekly activity theatre."],
];

const timeline: [string, string][] = [
  ["2023", "A department starts tracking readiness by hand in a spreadsheet."],
  ["2024", "The skill-graph model replaces the spreadsheet across three departments."],
  ["2025", "Faculty review and senior referral loops enter the same record."],
  ["2026", "The four-workspace interface you are reading now."],
];

function About() {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">About</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.08] md:text-6xl">
            Institutions do not lack data. They lack a shared reading of it.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            CareerGraph was built inside a placement office that was drowning in exports. The fix
            was not another dashboard; it was agreeing, once, on what a prepared student looks like —
            then rendering that agreement everywhere.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl">Principles</h2>
          <dl className="mt-10 grid gap-px bg-border md:grid-cols-2">
            {principles.map(([n, title, body]) => (
              <div key={n} className="bg-background p-7">
                <span className="font-mono text-xs text-muted-foreground">{n}</span>
                <dt className="mt-3 text-2xl">{title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl">How it arrived here</h2>
          <ol className="mt-10 border-t border-border">
            {timeline.map(([year, body]) => (
              <li
                key={year}
                className="grid gap-2 border-b border-border py-6 md:grid-cols-[8rem_1fr]"
              >
                <span className="font-mono text-sm">{year}</span>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </SiteShell>
  );
}
