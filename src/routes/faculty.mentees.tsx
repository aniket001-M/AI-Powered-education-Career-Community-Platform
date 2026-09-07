import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState, LoadingState, Meter, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMentees } from "@/lib/services";

export const Route = createFileRoute("/faculty/mentees")({
  head: () => ({
    meta: [
      { title: "Mentees — CareerGraph" },
      {
        name: "description",
        content: "Assigned mentees with focus area, readiness index, last meeting and review flag.",
      },
      { property: "og:title", content: "Mentees — CareerGraph" },
      { property: "og:description", content: "The mentee cohort for this term, with flags." },
    ],
  }),
  component: MenteesPage,
});

const flags = ["all", "on-track", "needs-review", "critical"] as const;

function MenteesPage() {
  const [flag, setFlag] = useState<string>("all");
  const { data, isPending } = useQuery({ queryKey: ["mentees"], queryFn: getMentees });

  const items = (data ?? []).filter((m) => flag === "all" || m.flag === flag);

  return (
    <>
      <PageHeader
        eyebrow="Faculty"
        title="Mentees"
        description="Four assigned students. Flags are recalculated each week from roadmap movement and meeting cadence."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter mentees by flag">
        {flags.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={flag === f ? "default" : "outline"}
            aria-pressed={flag === f}
            onClick={() => setFlag(f)}
            className="capitalize"
          >
            {f.replace("-", " ")}
          </Button>
        ))}
      </div>

      {isPending ? (
        <LoadingState rows={3} label="Loading mentees" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No mentees in this state"
          description="No assigned student currently carries that flag."
          action={
            <Button variant="outline" onClick={() => setFlag("all")}>
              Show all
            </Button>
          }
        />
      ) : (
        <div className="grid gap-px bg-border md:grid-cols-2">
          {items.map((m) => (
            <article key={m.id} className="bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl">{m.name}</h2>
                  <p className="label-caps mt-1">
                    Batch {m.batch} · {m.focus}
                  </p>
                </div>
                <Badge
                  variant={m.flag === "on-track" ? "secondary" : "outline"}
                  className="font-mono text-[11px] uppercase"
                >
                  {m.flag.replace("-", " ")}
                </Badge>
              </div>
              <div className="mt-5">
                <Meter value={m.readiness} label="Readiness" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Last meeting {m.lastMeeting}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => toast.success(`Meeting requested with ${m.name}`)}>
                  Schedule meeting
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast("Note added to the record")}
                >
                  Add note
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
