import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { ErrorState, LoadingState, Meter, PageHeader, StatCard } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getApplications, getFlakyFeed, getRoadmap, getStudentProfile } from "@/lib/services";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Student overview — CareerGraph" },
      {
        name: "description",
        content: "Readiness, active roadmap milestone, application pipeline and the intelligence feed.",
      },
      { property: "og:title", content: "Student overview — CareerGraph" },
      { property: "og:description", content: "One screen for where a student stands this term." },
    ],
  }),
  component: StudentOverview,
});

function StudentOverview() {
  const [breakFeed, setBreakFeed] = useState(false);
  const profile = useQuery({ queryKey: ["profile"], queryFn: getStudentProfile });
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: getRoadmap });
  const apps = useQuery({ queryKey: ["applications"], queryFn: getApplications });
  const feed = useQuery({
    queryKey: ["feed", breakFeed],
    queryFn: () => getFlakyFeed(breakFeed),
    retry: false,
  });

  const active = roadmap.data?.find((m) => m.status === "in-progress");
  const inFlight = apps.data?.filter((a) => !["rejected", "draft"].includes(a.stage)).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Term 4 · 2026"
        title={profile.isPending ? "Loading your record" : `Good morning, ${profile.data?.name.split(" ")[0]}`}
        description="Everything on this page is generated from your current skill graph and application ledger."
        actions={
          <Button asChild>
            <Link to="/student/opportunities">
              Review matches
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {profile.isPending ? (
        <LoadingState rows={2} label="Loading your summary" />
      ) : (
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Readiness index" value={String(profile.data!.readiness)} delta="+6" hint="Out of 100" />
          <StatCard label="CGPA" value={profile.data!.cgpa.toFixed(2)} hint="Cumulative" />
          <StatCard label="Live applications" value={String(inFlight)} hint="Excludes drafts" />
          <StatCard label="Mentor" value={profile.data!.mentor.split(" ").slice(-1)[0]} hint={profile.data!.mentor} />
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <p className="label-caps">Active milestone</p>
          {roadmap.isPending ? (
            <LoadingState rows={1} label="Loading roadmap" />
          ) : active ? (
            <>
              <h2 className="mt-3 text-2xl">{active.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{active.summary}</p>
              <div className="mt-5">
                <Meter value={45} label={`${active.term} · ${active.weeks} weeks`} />
              </div>
              <Link
                to="/student/roadmap"
                className="mt-5 inline-flex items-center gap-2 text-sm underline underline-offset-8"
              >
                Open roadmap
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : null}
        </div>

        <div className="border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="label-caps">Intelligence feed</p>
            <div className="flex items-center gap-2">
              <Label htmlFor="break-feed" className="text-xs text-muted-foreground">
                Simulate failure
              </Label>
              <Switch id="break-feed" checked={breakFeed} onCheckedChange={setBreakFeed} />
            </div>
          </div>
          <div className="mt-4">
            {feed.isPending ? (
              <LoadingState rows={2} label="Loading feed" />
            ) : feed.isError ? (
              <ErrorState
                description={(feed.error as Error).message}
                onRetry={() => feed.refetch()}
                retrying={feed.isFetching}
              />
            ) : (
              <ul className="space-y-3">
                {feed.data!.map((item) => (
                  <li key={item} className="border-b border-border pb-3 text-sm last:border-b-0">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between border-b border-border pb-3">
          <h2 className="text-2xl">Recent applications</h2>
          <Link to="/student/applications" className="text-sm underline underline-offset-8">
            View all
          </Link>
        </div>
        {apps.isPending ? (
          <div className="mt-4">
            <LoadingState rows={3} label="Loading applications" />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border border border-border bg-card">
            {apps.data!.slice(0, 4).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{a.role}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.company} · updated {a.updatedAt}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-[11px] uppercase">
                  {a.stage}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
