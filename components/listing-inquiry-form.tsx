"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/tracking-client";

interface ListingInquiryFormProps {
  listingTitle: string;
  listingSlug: string;
  googleAdsConversionTarget?: string;
}

export function ListingInquiryForm({
  listingTitle,
  listingSlug,
  googleAdsConversionTarget,
}: ListingInquiryFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `I would like more information about ${listingTitle}.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          eventType: "Listing inquiry",
          eventDate: phone,
          message: `${message}\n\nListing: ${listingTitle}\nSlug: ${listingSlug}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send inquiry");
      }

      trackEvent("listing_inquiry_submit", {
        listingTitle,
        listingSlug,
        googleAdsConversionTarget,
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send inquiry");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center">
        <h3 className="text-lg font-semibold">Inquiry sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for reaching out. We will follow up with details about this
          property.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          id="listing-inquiry-error"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="listing-name">Name</Label>
        <Input
          id="listing-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "listing-inquiry-error" : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="listing-email">Email</Label>
        <Input
          id="listing-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "listing-inquiry-error" : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="listing-phone">Phone / WhatsApp</Label>
        <Input
          id="listing-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="listing-message">Message</Label>
        <textarea
          id="listing-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          required
          disabled={isSubmitting}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "listing-inquiry-error" : undefined}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        onClick={() =>
          trackEvent("listing_inquiry_submit_click", {
            listingTitle,
            listingSlug,
          })
        }
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send listing inquiry
      </Button>
    </form>
  );
}
