import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LoadingState, PageHeader, StatCard } from "@/components/states";
import { Button } from "@/components/ui/button";
import { getMentees, getMetrics } from "@/lib/services";

export const Route = createFileRoute("/faculty/")({
  head: () => ({
    meta: [
      { title: "Faculty overview — CareerGraph" },
      {
        name: "description",
        content:
          "Mentee load, pending roadmap reviews and escalations that need department action.",
      },
      { property: "og:title", content: "Faculty overview — CareerGraph" },
      { property: "og:description", content: "A mentor's queue for the current term." },
    ],
  }),
  component: FacultyOverview,
});

const queue: [string, string, string][] = [
  ["Systems depth track", "Aniket Ghosh", "Sign-off unblocks the research elective."],
  ["Portfolio narrative", "Divya Raman", "Second revision submitted 20 Aug."],
  ["Interview loop report", "Sana Qureshi", "Panel notes awaiting your summary."],
];

function FacultyOverview() {
  const metrics = useQuery({
    queryKey: ["metrics", "faculty"],
    queryFn: () => getMetrics("faculty"),
  });
  const mentees = useQuery({ queryKey: ["mentees"], queryFn: getMentees });

  const critical = (mentees.data ?? []).filter((m) => m.flag === "critical");

  return (
    <>
      <PageHeader
        eyebrow="Faculty"
        title="Mentor overview"
        description="Reviews you sign off here change what a student's roadmap allows them to start next."
        actions={
          <Button asChild>
            <Link to="/faculty/mentees">
              Open mentee list
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {metrics.isPending ? (
        <LoadingState rows={2} label="Loading metrics" />
      ) : (
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {metrics.data!.map((m) => (
            <StatCard key={m.id} label={m.label} value={m.value} delta={m.delta} hint={m.hint} />
          ))}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <p className="label-caps">Review queue</p>
          <ul className="mt-4 divide-y divide-border">
            {queue.map(([title, who, note]) => (
              <li key={title} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {who} · {note}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success(`${title} signed off`)}
                >
                  Sign off
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-border bg-card p-6">
          <p className="label-caps">Escalations</p>
          {mentees.isPending ? (
            <div className="mt-4">
              <LoadingState rows={1} label="Loading escalations" />
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {critical.map((m) => (
                <li key={m.id} className="border border-foreground p-4">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.focus} · readiness {m.readiness} · last met {m.lastMeeting}
                  </p>
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => toast("Escalated to the department head")}
                  >
                    Escalate to department
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
