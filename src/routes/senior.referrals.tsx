import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getReferrals } from "@/lib/services";
import type { Referral } from "@/lib/types";

export const Route = createFileRoute("/senior/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — CareerGraph" },
      {
        name: "description",
        content:
          "Referral requests from students, from pending through forwarded, interviewing and closed.",
      },
      { property: "og:title", content: "Referrals — CareerGraph" },
      { property: "og:description", content: "The senior's referral ledger for the cohort." },
    ],
  }),
  component: ReferralsPage,
});

const statuses = ["all", "pending", "forwarded", "interviewing", "closed"] as const;

function ReferralsPage() {
  const [status, setStatus] = useState<string>("all");
  const { data, isPending } = useQuery({ queryKey: ["referrals"], queryFn: getReferrals });

  const items = (data ?? []).filter((r) => status === "all" || r.status === status);

  return (
    <>
      <PageHeader
        eyebrow="Senior"
        title="Referrals"
        description="Forwarding a request attaches the student's verified graph to your internal recommendation."
      />

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="flex-wrap">
          {statuses.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <LoadingState rows={3} label="Loading referrals" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No requests here"
          description="Nothing in your referral ledger currently sits at this status."
          action={
            <Button variant="outline" onClick={() => setStatus("all")}>
              Show all
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id}>
              <ReferralCard referral={r} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ReferralCard({ referral }: { referral: Referral }) {
  const [state, setState] = useState(referral.status);
  const [busy, setBusy] = useState(false);

  async function act(next: Referral["status"], message: string) {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    setState(next);
    toast.success(message);
  }

  return (
    <article className="border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">{referral.student}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {referral.role} · {referral.company}
          </p>
          <p className="label-caps mt-2">Submitted {referral.submittedAt}</p>
        </div>
        <Badge
          variant={state === "closed" ? "outline" : "secondary"}
          className="font-mono text-[11px] uppercase"
        >
          {state}
        </Badge>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy || state !== "pending"}
          onClick={() => act("forwarded", `Referral forwarded for ${referral.student}`)}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Working
            </>
          ) : state === "pending" ? (
            "Forward internally"
          ) : (
            "Already actioned"
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || state === "closed"}
          onClick={() => act("closed", "Request closed")}
        >
          Close request
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toast("Graph opened in a side panel")}>
          View graph
        </Button>
      </div>
    </article>
  );
}
