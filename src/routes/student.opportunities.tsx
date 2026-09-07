import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getJobs } from "@/lib/services";
import type { JobRole } from "@/lib/types";

export const Route = createFileRoute("/student/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — CareerGraph" },
      {
        name: "description",
        content: "Roles scored against the current skill graph, filterable by type, mode and match threshold.",
      },
      { property: "og:title", content: "Opportunities — CareerGraph" },
      { property: "og:description", content: "Matched internships and full-time roles for this term." },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const [type, setType] = useState("all");
  const [mode, setMode] = useState("all");
  const [minMatch, setMinMatch] = useState(60);
  const { data, isPending } = useQuery({ queryKey: ["jobs"], queryFn: getJobs });

  const items = (data ?? []).filter(
    (j) =>
      (type === "all" || j.type === type) &&
      (mode === "all" || j.mode === mode) &&
      j.matchScore >= minMatch,
  );

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Opportunities"
        description="Match scores are computed from your verified proficiency against each role's requirements."
      />

      <div className="grid gap-5 border border-border bg-card p-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="type">Role type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mode">Work mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger id="mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="onsite">Onsite</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="match">Minimum match · {minMatch}%</Label>
          <Slider
            id="match"
            value={[minMatch]}
            onValueChange={([v]) => setMinMatch(v ?? 0)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </div>

      {isPending ? (
        <LoadingState rows={3} label="Loading opportunities" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No roles above this threshold"
          description="Lower the match requirement or widen the filters to see more of the board."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setType("all");
                setMode("all");
                setMinMatch(0);
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function JobCard({ job }: { job: JobRole }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState(false);

  async function apply() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setApplied(true);
    setOpen(false);
    toast.success(`Application drafted for ${job.title}`);
  }

  return (
    <article className="border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl">{job.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company} · {job.salaryRange}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {job.location} · {job.mode} · {job.type}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl tabular-nums">{job.matchScore}%</p>
          <p className="label-caps">Match</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{job.description}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {job.skills.map((s) => (
          <li key={s}>
            <Badge variant="outline" className="font-mono text-[11px]">
              {s}
            </Badge>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={applied}>{applied ? "Applied" : "Apply"}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply to {job.title}</DialogTitle>
              <DialogDescription>
                Your graph, roadmap progress and portfolio will be attached to this application.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={apply} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Submitting
                  </>
                ) : (
                  "Confirm application"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => toast("Saved to your shortlist")}>
          Save
        </Button>
        <Button variant="ghost" onClick={() => toast("Referral request sent to seniors")}>
          Request referral
        </Button>
      </div>
    </article>
  );
}
