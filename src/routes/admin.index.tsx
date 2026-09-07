import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { LoadingState, Meter, PageHeader, StatCard } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { getMetrics, getStudentRecords } from "@/lib/services";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Administration overview — CareerGraph" },
      {
        name: "description",
        content: "Cohort size, placement rate, readiness median and the at-risk queue in one view.",
      },
      { property: "og:title", content: "Administration overview — CareerGraph" },
      {
        property: "og:description",
        content: "The placement office's daily read of the institution.",
      },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const metrics = useQuery({ queryKey: ["metrics", "admin"], queryFn: () => getMetrics("admin") });
  const records = useQuery({ queryKey: ["records"], queryFn: getStudentRecords });

  const atRisk = (records.data ?? []).filter((r) => r.status === "at-risk");

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Institution overview"
        description="Rolling twelve-month figures on the shared readiness definition. Updated nightly."
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

      <section>
        <div className="flex items-end justify-between border-b border-border pb-3">
          <h2 className="text-2xl">At-risk queue</h2>
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-2 text-sm underline underline-offset-8"
          >
            Open register
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {records.isPending ? (
          <div className="mt-4">
            <LoadingState rows={2} label="Loading students" />
          </div>
        ) : (
          <ul className="mt-4 grid gap-px bg-border md:grid-cols-2">
            {atRisk.map((r) => (
              <li key={r.id} className="bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium">{r.name}</p>
                    <p className="label-caps mt-1">
                      {r.department} · Batch {r.batch}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[11px] uppercase">
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-4">
                  <Meter value={r.readiness} label="Readiness" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {r.applications} application{r.applications === 1 ? "" : "s"} filed
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
