import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApplications } from "@/lib/services";
import type { ApplicationStage } from "@/lib/types";

export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title: "Applications — CareerGraph" },
      {
        name: "description",
        content: "Every application from draft to offer, with the next concrete step on each row.",
      },
      { property: "og:title", content: "Applications — CareerGraph" },
      { property: "og:description", content: "The application ledger for this placement window." },
    ],
  }),
  component: ApplicationsPage,
});

const stages: (ApplicationStage | "all")[] = [
  "all",
  "draft",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

function ApplicationsPage() {
  const [stage, setStage] = useState<string>("all");
  const { data, isPending } = useQuery({ queryKey: ["applications"], queryFn: getApplications });

  const items = (data ?? []).filter((a) => stage === "all" || a.stage === stage);

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title="Applications"
        description="Five tracked applications this window. Stages update when a recruiter or mentor records an event."
        actions={<Button variant="outline">Export ledger</Button>}
      />

      <Tabs value={stage} onValueChange={setStage}>
        <TabsList className="flex-wrap">
          {stages.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <LoadingState rows={4} label="Loading applications" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing at this stage"
          description="No applications are currently sitting in this stage of the pipeline."
          action={
            <Button variant="outline" onClick={() => setStage("all")}>
              Show all
            </Button>
          }
        />
      ) : (
        <div className="border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Next step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.role}</TableCell>
                  <TableCell className="text-muted-foreground">{a.company}</TableCell>
                  <TableCell>
                    <Badge
                      variant={a.stage === "rejected" ? "outline" : "secondary"}
                      className="font-mono text-[11px] uppercase"
                    >
                      {a.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.updatedAt}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.nextStep}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
