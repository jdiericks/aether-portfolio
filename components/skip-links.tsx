"use client";

function skipTo(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  target.scrollIntoView({ block: "start", behavior: "smooth" });
  target.focus({ preventScroll: true });
}

export function SkipLinks() {
  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          window.history.pushState(null, "", "#main-content");
          skipTo("main-content");
        }}
        className="fixed left-4 top-4 z-[100] rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg ring-2 ring-ring"
      >
        Skip to main content
      </a>
      <a
        href="#site-footer"
        onClick={(event) => {
          event.preventDefault();
          window.history.pushState(null, "", "#site-footer");
          skipTo("site-footer");
        }}
        className="fixed left-4 top-16 z-[100] rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg ring-2 ring-ring"
      >
        Skip to footer
      </a>
    </nav>
  );
}
