import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { alumniStories } from "@/lib/mock-data";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Stories — CareerGraph" },
      {
        name: "description",
        content:
          "Graduate paths recorded step by step: the gap each person found, and what closed it.",
      },
      { property: "og:title", content: "Stories — CareerGraph" },
      {
        property: "og:description",
        content: "Alumni paths from first internship to current role, told through the graph.",
      },
    ],
  }),
  component: Stories,
});

function Stories() {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">Stories</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.08] md:text-6xl">
            Paths, written down while they were still happening.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5">
          {alumniStories.map((s) => (
            <article key={s.id} className="border-b border-border py-14">
              <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
                <div>
                  <h2 className="text-3xl">{s.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {s.role} · {s.company}
                  </p>
                  <Badge variant="outline" className="mt-4 font-mono text-[11px]">
                    Batch of {s.batch}
                  </Badge>
                </div>
                <div>
                  <blockquote className="font-display text-2xl leading-snug">
                    “{s.quote}”
                  </blockquote>
                  <ol className="mt-8 space-y-3 border-l border-border pl-5">
                    {s.path.map((step) => (
                      <li key={step} className="relative text-sm text-muted-foreground">
                        <span className="absolute -left-[1.4rem] top-2 h-1.5 w-1.5 bg-foreground" />
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
