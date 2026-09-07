import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, LoadingState, PageHeader } from "@/components/states";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudentRecords } from "@/lib/services";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Student register — CareerGraph" },
      {
        name: "description",
        content: "Search and filter the tracked student register by department, batch and status.",
      },
      { property: "og:title", content: "Student register — CareerGraph" },
      { property: "og:description", content: "Every tracked student, sortable by readiness." },
    ],
  }),
  component: StudentRegister,
});

function StudentRegister() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);
  const { data, isPending } = useQuery({ queryKey: ["records"], queryFn: getStudentRecords });

  const rows = (data ?? [])
    .filter(
      (r) =>
        r.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        (status === "all" || r.status === status),
    )
    .sort((a, b) => (sortDesc ? b.readiness - a.readiness : a.readiness - b.readiness));

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Student register"
        description="Six of 2,418 records are shown in this demonstration dataset."
        actions={<Button variant="outline">Download CSV</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <div className="space-y-2">
          <Label htmlFor="q">Search by name</Label>
          <Input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Rhea"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="at-risk">At risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <LoadingState rows={4} label="Loading register" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No students match"
          description="Adjust the search text or status filter to widen the register."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => setSortDesc((v) => !v)}
                    className="underline underline-offset-4"
                    aria-label={`Sort by readiness ${sortDesc ? "ascending" : "descending"}`}
                  >
                    Readiness {sortDesc ? "↓" : "↑"}
                  </button>
                </TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.department}</TableCell>
                  <TableCell className="font-mono text-xs">{r.batch}</TableCell>
                  <TableCell className="tabular-nums">{r.readiness}</TableCell>
                  <TableCell className="tabular-nums">{r.applications}</TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === "at-risk" ? "outline" : "secondary"}
                      className="font-mono text-[11px] uppercase"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
