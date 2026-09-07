import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { EmptyState, LoadingState, Meter, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSkills } from "@/lib/services";

export const Route = createFileRoute("/student/skills")({
  head: () => ({
    meta: [
      { title: "Skill graph — CareerGraph" },
      {
        name: "description",
        content:
          "Proficiency against market demand for every tracked capability, with verification status.",
      },
      { property: "og:title", content: "Skill graph — CareerGraph" },
      { property: "og:description", content: "Where a student is strong, thin, and unverified." },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const { data, isPending } = useQuery({ queryKey: ["skills"], queryFn: getSkills });

  const items = (data ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (category === "all" || s.category === category),
  );

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Skill graph"
        description="Proficiency is your assessed level. Demand is the market signal for this term. Gaps are the distance between them."
        actions={<Button variant="outline">Request assessment</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <div className="space-y-2">
          <Label htmlFor="skill-search">Search skills</Label>
          <Input
            id="skill-search"
            placeholder="e.g. TypeScript"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skill-category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="skill-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="systems">Systems</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="design">Design</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <LoadingState rows={4} label="Loading skill graph" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No skills match"
          description="Try a different search term or category."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-px bg-border md:grid-cols-2">
          {items.map((s) => (
            <article key={s.id} className="bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl">
                    {s.name}
                    {s.verified ? <BadgeCheck className="h-4 w-4" aria-label="Verified" /> : null}
                  </h2>
                  <p className="label-caps mt-1">
                    {s.category} · {s.level}
                  </p>
                </div>
                <Badge
                  variant={s.verified ? "default" : "outline"}
                  className="font-mono text-[11px]"
                >
                  {s.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="mt-5 space-y-3">
                <Meter value={s.proficiency} label="Proficiency" />
                <Meter value={s.demandIndex} label="Market demand" />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Gap of {Math.max(0, s.demandIndex - s.proficiency)} points · last assessed{" "}
                {s.lastAssessed}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
