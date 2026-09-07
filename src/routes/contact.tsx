import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiry } from "@/lib/services";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — CareerGraph" },
      {
        name: "description",
        content:
          "Send an enquiry to the CareerGraph team about departmental rollout, data definitions or a walkthrough.",
      },
      { property: "og:title", content: "Contact — CareerGraph" },
      {
        property: "og:description",
        content: "A short form for institutions considering a CareerGraph rollout.",
      },
    ],
  }),
  component: Contact,
});

type Errors = Partial<Record<"name" | "email" | "message", string>>;

function Contact() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  function validate(): Errors {
    const e: Errors = {};
    if (values.name.trim().length < 2) e.name = "Enter at least two characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "Enter a valid email address.";
    if (values.message.trim().length < 20)
      e.message = `Add a little more detail (${values.message.trim().length}/20 characters).`;
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setStatus("saving");
    const result = await submitEnquiry(values);
    if (!result.ok) {
      setStatus("idle");
      setErrors({ email: result.message });
      toast.error(result.message);
      return;
    }
    setStatus("done");
    toast.success(result.message);
  }

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-2">
        <div>
          <p className="label-caps">Contact</p>
          <h1 className="mt-6 text-5xl leading-[1.08]">Tell us what your office is measuring.</h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Nothing is transmitted in this demonstration build — the form validates and responds
            locally so you can see every state.
          </p>
          <dl className="mt-10 space-y-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="label-caps">Placement office</dt>
              <dd className="mt-1 text-muted-foreground">office@careergraph.edu</dd>
            </div>
            <div>
              <dt className="label-caps">Response time</dt>
              <dd className="mt-1 text-muted-foreground">Two working days</dd>
            </div>
          </dl>
        </div>

        {status === "done" ? (
          <div className="flex h-fit flex-col items-start border border-foreground bg-card p-8">
            <Check className="h-6 w-6" aria-hidden />
            <h2 className="mt-4 text-2xl">Enquiry recorded</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you, {values.name.trim()}. A member of the team will reply to {values.email}.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setValues({ name: "", email: "", message: "" });
                setStatus("idle");
              }}
            >
              Send another
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-6 border border-border bg-card p-8">
            <Field
              id="name"
              label="Full name"
              error={errors.name}
              value={values.name}
              onChange={(v) => setValues((s) => ({ ...s, name: v }))}
            />
            <Field
              id="email"
              type="email"
              label="Institutional email"
              error={errors.email}
              value={values.email}
              onChange={(v) => setValues((s) => ({ ...s, email: v }))}
            />
            <div className="space-y-2">
              <Label htmlFor="message">What are you trying to measure?</Label>
              <Textarea
                id="message"
                rows={5}
                value={values.message}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
                onChange={(e) => setValues((s) => ({ ...s, message: e.target.value }))}
              />
              {errors.message ? (
                <p id="message-error" className="text-xs text-foreground">
                  {errors.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Minimum twenty characters.</p>
              )}
            </div>
            <Button type="submit" disabled={status === "saving"} className="w-full">
              {status === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Sending
                </>
              ) : (
                "Send enquiry"
              )}
            </Button>
          </form>
        )}
      </section>
    </SiteShell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
