import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoadingState, PageHeader } from "@/components/states";
import { getTrend } from "@/lib/services";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CareerGraph" },
      {
        name: "description",
        content: "Placement volume and readiness median across the last six quarters.",
      },
      { property: "og:title", content: "Analytics — CareerGraph" },
      { property: "og:description", content: "Quarterly placement and readiness trend lines." },
    ],
  }),
  component: Analytics,
});

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 11 };

function Analytics() {
  const { data, isPending } = useQuery({ queryKey: ["trend"], queryFn: getTrend });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Analytics"
        description="Both series use the same cohort definition, so they can be read against each other."
      />

      {isPending ? (
        <LoadingState rows={2} label="Loading analytics" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="border border-border bg-card p-6">
            <p className="label-caps">Placements per quarter</p>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data ?? []}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axis} />
                  <YAxis tickLine={false} axisLine={false} tick={axis} width={32} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="placements" fill="var(--color-chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="border border-border bg-card p-6">
            <p className="label-caps">Median readiness index</p>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data ?? []}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axis} />
                  <YAxis
                    domain={[40, 80]}
                    tickLine={false}
                    axisLine={false}
                    tick={axis}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="readiness"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
