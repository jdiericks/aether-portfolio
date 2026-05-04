"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sanitizeRichHtml } from "@/lib/sanitize-html";
import type { SiteContentMap } from "@/lib/site-content";

interface SiteAnnouncementsProps {
  content: SiteContentMap;
}

const MAJOR_DISMISS_PREFIX = "site_major_announcement_dismissed:";

function enabled(value: string | undefined) {
  return value === "true";
}

export function SiteAnnouncements({ content }: SiteAnnouncementsProps) {
  const minorEnabled = enabled(content.announcement_minor_enabled);
  const majorEnabled = enabled(content.announcement_major_enabled);
  const minorText = content.announcement_minor_text?.trim();
  const minorLinkLabel = content.announcement_minor_link_label?.trim();
  const minorLinkUrl = content.announcement_minor_link_url?.trim();
  const majorTitle = content.announcement_major_title?.trim() || "Announcement";
  const majorBody =
    content.announcement_major_content?.trim() ||
    content.announcement_major_body?.trim();
  const majorId =
    content.announcement_major_id?.trim() ||
    `${majorTitle}:${majorBody}`.slice(0, 120);
  const [showMajor, setShowMajor] = useState(() => {
    if (!majorEnabled || !majorBody || typeof window === "undefined") return false;
    return window.localStorage.getItem(`${MAJOR_DISMISS_PREFIX}${majorId}`) !== "true";
  });

  const dismissMajor = () => {
    window.localStorage.setItem(`${MAJOR_DISMISS_PREFIX}${majorId}`, "true");
    setShowMajor(false);
  };

  return (
    <>
      {minorEnabled && minorText && (
        <div
          className="fixed inset-x-0 top-16 z-40 border-b bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 text-center sm:flex-row">
            <span>{minorText}</span>
            {minorLinkLabel && minorLinkUrl && (
              <Link
                href={minorLinkUrl}
                className="rounded-full bg-primary-foreground px-3 py-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                {minorLinkLabel}
              </Link>
            )}
          </div>
        </div>
      )}

      {majorEnabled && majorBody && (
        <Dialog open={showMajor} onOpenChange={(open) => (!open ? dismissMajor() : setShowMajor(true))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{majorTitle}</DialogTitle>
              <DialogDescription asChild>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(majorBody) }}
                />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={dismissMajor}>
                {content.announcement_major_button_label || "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
