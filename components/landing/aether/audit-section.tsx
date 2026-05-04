"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/tracking-client";

interface AuditSectionProps {
  label?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  successMessage?: string;
}

export function AuditSection({
  label = "Free AI Readiness Audit",
  title = "Not sure if Aether is right for you?",
  description = "Start with a free AI Readiness Audit. I'll look at how your business currently handles its online presence — your website, your tools, your SEO setup — and show you exactly where an AI-managed system could save you time and money. No pitch. Just clarity.",
  ctaLabel = "Get Your Free AI Readiness Audit",
  successMessage = "Thanks — I'll review your answers and get back to you within 48 hours with a personalised summary.",
}: AuditSectionProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessType: "",
    currentTools: "",
    hoursPerWeek: "",
    hasStructuredData: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = "audit-form-error";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit audit");
      }

      trackEvent("audit_form_submit", {
        source: "audit_section",
        businessType: formData.businessType,
        hoursPerWeek: formData.hoursPerWeek,
        hasStructuredData: formData.hasStructuredData,
      });
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        businessType: "",
        currentTools: "",
        hoursPerWeek: "",
        hasStructuredData: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [event.target.id]: event.target.value }));
  };

  return (
    <section
      id="audit"
      className="py-20 text-[var(--section-text)] md:py-32"
      style={{ background: "var(--section-alt-bg)" }}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <h2 className="mb-5 text-3xl font-light tracking-tight md:text-4xl">
              {title}
            </h2>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              {description}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Reviewed personally — not by a bot
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                48-hour response time
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                No obligation, no sales call required
              </li>
            </ul>
          </div>

          <Card>
            <CardContent className="p-6 md:p-8">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">Audit requested</h3>
                  <p className="mb-4 max-w-md text-sm text-muted-foreground">
                    {successMessage}
                  </p>
                  <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                    Submit another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {error && (
                    <div
                      id={errorId}
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@business.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business type</Label>
                    <Input
                      id="businessType"
                      placeholder="e.g. real estate, e-commerce, photography, professional services"
                      value={formData.businessType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentTools">
                      What do you currently use to manage your website and social media?
                    </Label>
                    <textarea
                      id="currentTools"
                      rows={3}
                      placeholder="e.g. Squarespace, WordPress + a VA, Mailchimp, Buffer, manual posting..."
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.currentTools}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hoursPerWeek">Hours/week on marketing</Label>
                      <Input
                        id="hoursPerWeek"
                        placeholder="e.g. 5–10 hours"
                        value={formData.hoursPerWeek}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hasStructuredData">
                        Structured data on your site?
                      </Label>
                      <select
                        id="hasStructuredData"
                        value={formData.hasStructuredData}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Don't know">Don&apos;t know</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Submitting...
                      </>
                    ) : (
                      ctaLabel
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    By submitting you agree to be contacted about your audit. No spam.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
