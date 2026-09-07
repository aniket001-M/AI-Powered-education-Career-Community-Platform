import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingState, Meter, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStudentProfile, saveProfile } from "@/lib/services";
import type { StudentProfile } from "@/lib/types";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CareerGraph" },
      {
        name: "description",
        content: "Identity, department, mentor and headline that accompany every application.",
      },
      { property: "og:title", content: "Profile — CareerGraph" },
      { property: "og:description", content: "The record attached to a student's applications." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, isPending } = useQuery({ queryKey: ["profile"], queryFn: getStudentProfile });
  const [draft, setDraft] = useState<StudentProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (draft.headline.trim().length < 10) {
      setError("Your headline should be at least ten characters.");
      return;
    }
    setError(null);
    setSaving(true);
    const res = await saveProfile(draft);
    setSaving(false);
    toast.success(res.message);
  }

  if (isPending || !draft) {
    return (
      <>
        <PageHeader eyebrow="Student workspace" title="Profile" />
        <LoadingState rows={3} label="Loading profile" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Profile"
        description="This record is attached to every application and shared with your assigned mentor."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form onSubmit={onSave} noValidate className="space-y-6 border border-border bg-card p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={draft.email} readOnly aria-readonly className="bg-muted" />
              <p className="text-xs text-muted-foreground">Institutional address cannot be edited.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input
                id="dept"
                value={draft.department}
                onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Textarea
              id="headline"
              rows={3}
              value={draft.headline}
              aria-invalid={!!error}
              aria-describedby={error ? "headline-error" : undefined}
              onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            />
            {error ? (
              <p id="headline-error" className="text-xs">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">One line on what you are building toward.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving
                </>
              ) : (
                "Save profile"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(data!)} disabled={saving}>
              Discard changes
            </Button>
          </div>
        </form>

        <aside className="space-y-5 border border-border bg-card p-6">
          <div>
            <p className="label-caps">Record</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Student ID</dt>
                <dd className="font-mono">{draft.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Batch</dt>
                <dd>{draft.batch}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">CGPA</dt>
                <dd className="tabular-nums">{draft.cgpa.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mentor</dt>
                <dd>{draft.mentor}</dd>
              </div>
            </dl>
          </div>
          <div className="border-t border-border pt-5">
            <Meter value={draft.readiness} label="Readiness index" />
          </div>
        </aside>
      </div>
    </>
  );
}
