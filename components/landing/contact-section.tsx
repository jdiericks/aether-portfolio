"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Loader2, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/tracking-client";

interface ContactSectionProps {
  label?: string;
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  phoneHref?: string;
  location?: string;
  note?: string;
  googleAdsConversionTarget?: string;
}

export function ContactSection({
  label = "Let's Connect",
  title = "Start Your Move",
  description = "Ready to buy, sell, or invest? Tell us what you need and we will map the next step.",
  email = "hello@diericksrealty.com",
  phone = "+1 (555) 013-4420",
  phoneHref = "tel:+15550134420",
  location = "Austin, Texas",
  note = "Serving buyers, sellers, and relocation clients across Austin, Westlake Hills, Lake Travis, and the surrounding market.",
  googleAdsConversionTarget = "",
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    eventType: "",
    eventDate: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = "contact-form-error";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      trackEvent("contact_form_submit", {
        source: "home_contact",
        goal: formData.eventType,
        timeline: formData.eventDate,
        googleAdsConversionTarget,
      });
      setIsSubmitted(true);
      setFormData({ name: "", email: "", eventType: "", eventDate: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: email,
      href: `mailto:${email}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: phone,
      href: phoneHref,
    },
    {
      icon: MapPin,
      label: "Location",
      value: location,
      href: "#",
    },
  ];

  return (
    <section
      id="contact"
      className="site-contact-section py-20 md:py-32"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
            {label}
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-6">
            <h3 className="text-xl font-medium">Contact Information</h3>
            <div className="space-y-4">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() =>
                      trackEvent(`${item.label.toLowerCase()}_click`, {
                        source: "home_contact",
                        href: item.href,
                      })
                    }
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  </a>
                );
              })}
            </div>
            {note && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">{note}</p>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for reaching out. We&apos;ll get back to you soon.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div
                      id={errorId}
                      className="p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
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
                        placeholder="you@example.com"
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
                  <Label htmlFor="eventType">Real Estate Goal</Label>
                    <Input
                      id="eventType"
                    placeholder="Buying, selling, relocating, investing..."
                      value={formData.eventType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="eventDate">Ideal Timeline</Label>
                    <Input
                      id="eventDate"
                    placeholder="When would you like to move?"
                      value={formData.eventDate}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="message">Tell Us About Your Move</Label>
                    <textarea
                      id="message"
                      rows={4}
                    placeholder="Share your target neighborhoods, budget, must-haves, or listing goals..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      value={formData.message}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
