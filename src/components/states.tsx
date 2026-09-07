import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="label-caps mb-2">{eyebrow}</p> : null}
        <h1 className="text-3xl leading-tight md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function LoadingState({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 border border-border bg-card p-4">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center border border-dashed border-border bg-card px-6 py-14 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something interrupted this view",
  description,
  onRetry,
  retrying,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 border border-foreground bg-card p-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" aria-hidden />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          <RotateCcw className={cn("h-4 w-4", retrying && "animate-spin")} aria-hidden />
          {retrying ? "Retrying" : "Retry"}
        </Button>
      ) : null}
    </div>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-baseline justify-between">
          <span className="label-caps">{label}</span>
          <span className="font-mono text-xs tabular-nums">{value}</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-1.5 w-full bg-muted"
      >
        <div className="h-full bg-foreground" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
}) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums">{value}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{hint}</span>
        {delta ? <span className="font-mono">{delta}</span> : null}
      </div>
    </div>
  );
}
