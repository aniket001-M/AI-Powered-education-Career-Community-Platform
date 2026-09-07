import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Lock, Loader2 } from "lucide-react";
import { EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoadmap } from "@/lib/services";
import type { RoadmapMilestone } from "@/lib/types";

export const Route = createFileRoute("/student/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — CareerGraph" },
      {
        name: "description",
        content:
          "Term-by-term milestones with status, duration and the outcomes each one must produce.",
      },
      { property: "og:title", content: "Roadmap — CareerGraph" },
      {
        property: "og:description",
        content: "The planned route from foundations audit to placement window.",
      },
    ],
  }),
  component: RoadmapPage,
});

const filters = ["all", "completed", "in-progress", "upcoming", "blocked"] as const;
type Filter = (typeof filters)[number];

const icons: Record<RoadmapMilestone["status"], typeof CheckCircle2> = {
  completed: CheckCircle2,
  "in-progress": Loader2,
  upcoming: CircleDashed,
  blocked: Lock,
};

function RoadmapPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isPending } = useQuery({ queryKey: ["roadmap"], queryFn: getRoadmap });

  const items = (data ?? []).filter((m) => filter === "all" || m.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Roadmap"
        description="Five milestones across four terms. Blocked items need a faculty sign-off before they open."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter milestones by status">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f.replace("-", " ")}
          </Button>
        ))}
      </div>

      {isPending ? (
        <LoadingState rows={4} label="Loading roadmap" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No milestones in this state"
          description="Nothing on your roadmap currently matches that filter."
          action={
            <Button variant="outline" onClick={() => setFilter("all")}>
              Clear filter
            </Button>
          }
        />
      ) : (
        <ol className="relative border-l border-border pl-6">
          {items.map((m) => {
            const Icon = icons[m.status];
            return (
              <li key={m.id} className="mb-6 last:mb-0">
                <span className="absolute -left-[9px] mt-4 flex h-[18px] w-[18px] items-center justify-center border border-border bg-background">
                  <Icon
                    className={`h-3 w-3 ${m.status === "in-progress" ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                </span>
                <article className="border border-border bg-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl">{m.title}</h2>
                    <Badge variant="outline" className="font-mono text-[11px] uppercase">
                      {m.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>
                  <p className="label-caps mt-4">
                    {m.term} · {m.weeks} weeks
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {m.outcomes.map((o) => (
                      <li key={o} className="flex gap-2">
                        <span aria-hidden>—</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" disabled={m.status === "blocked" || m.status === "completed"}>
                      {m.status === "completed" ? "Completed" : "Log progress"}
                    </Button>
                    <Button size="sm" variant="outline">
                      Request review
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
