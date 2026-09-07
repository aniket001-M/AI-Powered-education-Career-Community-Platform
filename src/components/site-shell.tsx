import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/platform", label: "Platform" },
  { to: "/stories", label: "Stories" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-mono text-sm tracking-[0.24em] uppercase">
            Careergraph
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-foreground underline underline-offset-8" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="text-sm transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <Button asChild size="sm">
              <Link to="/workspaces">Enter workspace</Link>
            </Button>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <nav aria-label="Mobile" className="border-t border-border px-5 py-4 md:hidden">
            <ul className="space-y-3">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} onClick={() => setOpen(false)} className="text-sm">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/workspaces"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium"
                >
                  Enter workspace
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
          <div>
            <p className="font-mono text-sm tracking-[0.24em] uppercase">Careergraph</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Career intelligence for institutions that treat placement as a curriculum, not a
              season.
            </p>
          </div>
          <FooterCol
            title="Product"
            items={[
              { to: "/platform", label: "Platform" },
              { to: "/workspaces", label: "Workspaces" },
              { to: "/stories", label: "Stories" },
            ]}
          />
          <FooterCol
            title="Institution"
            items={[
              { to: "/about", label: "About" },
              { to: "/contact", label: "Contact" },
            ]}
          />
          <div>
            <p className="label-caps">Note</p>
            <p className="mt-3 text-sm text-muted-foreground">
              This is a front-end demonstration. All figures, people and roles shown are mock data.
            </p>
          </div>
        </div>
        <div className="border-t border-border px-5 py-5 text-center font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
          © 2026 Careergraph — Demonstration build
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="label-caps">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="text-muted-foreground hover:text-foreground">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
