import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { LoadingState, PageHeader, StatCard } from "@/components/states";
import { Button } from "@/components/ui/button";
import { getMetrics, getReferrals } from "@/lib/services";

export const Route = createFileRoute("/senior/")({
  head: () => ({
    meta: [
      { title: "Senior overview — CareerGraph" },
      {
        name: "description",
        content: "Referral volume, conversions and open requests waiting on a senior's review.",
      },
      { property: "og:title", content: "Senior overview — CareerGraph" },
      { property: "og:description", content: "What an alumnus owes the cohort this month." },
    ],
  }),
  component: SeniorOverview,
});

function SeniorOverview() {
  const metrics = useQuery({
    queryKey: ["metrics", "senior"],
    queryFn: () => getMetrics("senior"),
  });
  const referrals = useQuery({ queryKey: ["referrals"], queryFn: getReferrals });

  const pending = (referrals.data ?? []).filter((r) => r.status === "pending");

  return (
    <>
      <PageHeader
        eyebrow="Senior"
        title="Referral overview"
        description="Requests reach you only after a mentor has confirmed the student is ready for the role."
        actions={
          <Button asChild>
            <Link to="/senior/referrals">
              Open referrals
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

      <section className="border border-border bg-card p-6">
        <p className="label-caps">Awaiting your decision</p>
        {referrals.isPending ? (
          <div className="mt-4">
            <LoadingState rows={2} label="Loading requests" />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-medium">{r.student}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.role} · {r.company} · submitted {r.submittedAt}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/senior/referrals">Review</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
