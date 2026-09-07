import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform — CareerGraph" },
      {
        name: "description",
        content:
          "Skill graph, term roadmap, opportunity matching, application tracking and placement analytics in one workspace.",
      },
      { property: "og:title", content: "Platform — CareerGraph" },
      {
        property: "og:description",
        content: "The five surfaces that make up the CareerGraph record, plus common questions.",
      },
    ],
  }),
  component: Platform,
});

const surfaces = [
  ["Skill graph", "Proficiency, demand index and verification for every tracked capability, re-scored each term."],
  ["Term roadmap", "Milestones with status, duration and named outcomes — including the ones blocked on a review."],
  ["Opportunity match", "Roles scored against the current graph, filterable by type, mode and match threshold."],
  ["Application ledger", "Draft through offer, with the next concrete step written on every row."],
  ["Placement analytics", "Cohort trend lines, at-risk volume and department comparisons on shared definitions."],
];

const faqs = [
  ["Is this a live product?", "No. This build is a front-end demonstration. Every student, role and figure shown is mock data held in the browser."],
  ["How is readiness scored?", "An index of 100 combining verified proficiency, roadmap completion and interview-loop performance."],
  ["Who can see a student's graph?", "The student, their assigned faculty mentor, and administration in aggregate. Seniors see only what a student attaches to a referral."],
  ["Can departments define their own tracks?", "Yes — roadmaps are per-department templates that a mentor can adjust per student."],
];

function Platform() {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">Platform</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.08] md:text-6xl">
            Five surfaces. One record underneath all of them.
          </h1>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5">
          <ol>
            {surfaces.map(([title, body], i) => (
              <li
                key={title}
                className="grid gap-3 border-b border-border py-10 last:border-b-0 md:grid-cols-[5rem_1fr_1fr] md:items-baseline"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-3xl">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="text-3xl">Questions</h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Button asChild size="lg">
            <Link to="/workspaces">
              Open a workspace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
