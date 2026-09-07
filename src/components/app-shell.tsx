import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function AppShell({
  workspace,
  person,
  items,
  children,
}: {
  workspace: string;
  person: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full md:flex">
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      <div className="flex items-center justify-between border-b border-border px-5 py-4 md:hidden">
        <span className="font-mono text-xs tracking-[0.2em] uppercase">{workspace}</span>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "border-b border-border bg-sidebar md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r",
          open ? "block" : "hidden md:block",
        )}
      >
        <div className="flex h-full flex-col justify-between p-5">
          <div>
            <Link to="/" className="font-mono text-xs tracking-[0.24em] uppercase">
              Careergraph
            </Link>
            <p className="mt-6 label-caps">{workspace}</p>
            <nav aria-label={`${workspace} navigation`} className="mt-3">
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.to;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 border border-transparent px-3 py-2 text-sm transition-colors",
                          active
                            ? "border-border bg-background font-medium text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="mt-8 space-y-4">
            <div className="border-t border-border pt-4">
              <p className="label-caps">Signed in as</p>
              <p className="mt-1 text-sm">{person}</p>
            </div>
            <Link
              to="/workspaces"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Switch workspace
            </Link>
          </div>
        </div>
      </aside>

      <main id="workspace-main" className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-5xl space-y-8">{children}</div>
      </main>
    </div>
  );
}
