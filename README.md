# Aether — AI-Powered Business System Site

This is the Aether marketing + product site, adapted from the same MCP-powered Next.js codebase used to ship real-estate, photography, and small-business deployments. It positions **Aether** — an AI-managed website and business system for serious small businesses — and is run as the personal portfolio / business site for the developer behind it.

The site has two jobs:

1. Convert a curious visitor into someone who requests a free **AI Readiness Audit**
2. Signal authority and expertise to Google through E-E-A-T — Experience, Expertise, Authoritativeness, and Trustworthiness

Every section is written for a busy, AI-forward small business owner — and built to demonstrate that the person who built it has actually shipped this work in production.

## What this site is

- **Hero** — `Run your business by talking to it.` + free AI Readiness Audit CTA
- **Problem** — six common pain points small business owners feel
- **Solution** — Aether as one system / one conversation
- **What's Included** — feature grid (modern site, AI content, social, SEO, structured data, accessibility, Core Web Vitals, analytics, team access, support)
- **Technical Credibility** — JSON-LD, WCAG 2.1 AA, Core Web Vitals callouts (the core E-E-A-T angle)
- **Aether in the wild** — real deployments (photography, real estate) with metric placeholders
- **Pricing** — $5,000 setup + $350/month, 10-client cap
- **About** — author photo, bio, credentials (E-E-A-T author identity)
- **Latest insight** — pulls from the `ContentPost` blog
- **AI Readiness Audit** — lead form (`/api/audit`)

## Tech Stack

- **Framework**: Next.js App Router (Next 16 / React 19)
- **Database**: PostgreSQL (Neon) via Prisma
- **File Storage**: Vercel Blob
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **AI tooling**: MCP server (HTTP + stdio) for managing site content, blog posts, social posts, listings, contact submissions
- **Analytics**: Built-in lightweight tracking + optional GA4 / GTM / Meta Pixel via env

## Editing Aether copy

All site copy is sourced from `lib/site-content.ts` (`SITE_CONTENT_DEFAULTS`) with optional overrides from the `SiteContent` Prisma table (editable via the admin dashboard or MCP `update_site_content`). The Aether-specific keys are:

- `hero_*` — headline, subheadline, CTAs
- `problem_label`, `problem_title`, `problem_item_1..6`
- `solution_label`, `solution_title`, `solution_description_1..2`, `solution_point_1..5`
- `tech_label`, `tech_title`, `tech_description`, `tech_pillar_1..3_title`/`_description`
- `pricing_*` — plan, setup, monthly, includes list, addon, capacity note
- `audit_label`, `audit_title`, `audit_description`, `audit_cta`, `audit_success_message`
- `agent_*` — author identity for E-E-A-T (name, title, bio, photo, specialties, service area, **agent_credentials**)
- `footer_tagline`, `footer_legal_entity`
- `seo_*` — page title, description, keywords (Person + Service schema is auto-emitted)

## Audit Form

The free AI Readiness Audit posts to `app/api/audit/route.ts`, which validates and writes to the existing `ContactSubmission` table (no new migration needed). Submissions show up in the admin dashboard under Inquiries, with `eventType = "AI Readiness Audit"` (or the submitter's business type) and the audit answers in the message body.

## SEO / E-E-A-T

The homepage emits three JSON-LD blocks:

- **Person** schema for the author (name, jobTitle, photo, knowsAbout, sameAs links)
- **Service** schema for Aether (offers, audience, area served, link to the Person provider)
- **WebPage** schema linking the page to the Service and the Person

Every page already inherits `JsonLd` helpers, breadcrumb support (`/listings`, `/insights`, `/locations`), and the existing accessibility / sitemap infrastructure. Run PageSpeed Insights and the Rich Results Test after launch and add the metric badges into the Proof section.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- Vercel account (for Blob storage)

### Installation

```bash
git clone <your-repo-url>
cd aether
npm install
cp .env.example .env
```

Update `.env` with your credentials (`DATABASE_URL`, `NEXTAUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`), then:

```bash
npm run db:migrate
npm run db:seed:admin
npm run dev
```

### Admin Dashboard

`/login` with the seeded admin email/password. The admin dashboard exposes site content, blog posts, contact + audit submissions, social post drafts, listings/case-study cards, theme controls, and accessibility / announcement settings. The MCP server exposes the same surface to AI assistants — see `mcp/tools.ts`.

### MCP Server

The MCP (Model Context Protocol) server runs as Vercel serverless functions under `/api/mcp` and as stdio transport for local Cursor integration. The same tools that manage real-estate listings let Aether manage clients, blog posts, social posts, and site content via conversation. See `mcp/tools.ts`.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in the Vercel dashboard
4. Deploy

The Vercel build command runs `prisma migrate deploy` before `next build`, so Neon tables are created from committed Prisma migrations. The deploy command sets `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1` to avoid Neon pooled-connection lock timeouts.

### Required production environment variables

- `DATABASE_URL` — Neon connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — production URL (e.g. `https://aether.systems`)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin login seeded by `db:seed:admin`

## Project Structure

```
aether/
├── app/
│   ├── api/
│   │   ├── audit/        # AI Readiness Audit submissions
│   │   ├── contact/      # legacy contact form
│   │   └── mcp/          # MCP serverless functions
│   ├── admin/            # admin dashboard
│   ├── insights/         # blog (E-E-A-T topical authority)
│   ├── listings/         # case-study / deployment cards
│   └── page.tsx          # Aether homepage
├── components/
│   ├── landing/
│   │   ├── aether/       # Aether-specific sections
│   │   │   ├── about-section.tsx
│   │   │   ├── audit-section.tsx
│   │   │   ├── included-section.tsx
│   │   │   ├── pricing-section.tsx
│   │   │   ├── problem-section.tsx
│   │   │   ├── proof-section.tsx
│   │   │   ├── solution-section.tsx
│   │   │   └── tech-credibility-section.tsx
│   │   ├── hero-section.tsx
│   │   ├── footer.tsx
│   │   ├── navbar.tsx
│   │   └── latest-post-section.tsx
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── site-content.ts   # Aether copy defaults (edit here)
│   └── ...
├── mcp/                  # MCP server (HTTP + stdio)
└── prisma/
    └── schema.prisma
```

## License

MIT
