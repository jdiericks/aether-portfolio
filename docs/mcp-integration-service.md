# MCP Integration Service — Add-On for Existing Business Websites

This document outlines a productized service for businesses that **already have a website** and want a Model Context Protocol (MCP) server "bolted on" so that AI assistants (Claude, ChatGPT, Cursor, internal copilots, etc.) can read from and act on their site and business systems.

It defines:

- What the service is and what it includes
- The standard MCP toolset every client gets out of the box
- How custom (client-specific) MCP tools are scoped, built, and shipped
- Hosting and deployment options
- Pricing tiers (one-time + recurring) and add-ons
- The delivery process from intake to launch and ongoing support

This is the companion offering to `docs/pricing-guidance.md` (which prices full website builds). Use this doc when the prospect already has a working site and only needs an AI/MCP layer.

---

## 1. What the service is

> **"We turn your existing website and back-office tools into something an AI assistant can talk to — securely, with your branding, your rules, and your data."**

The deliverable is an authenticated MCP server that is connected to the client's existing website (CMS, database, CRM, inventory, scheduling, etc.) and exposes a curated set of **tools** the client's AI assistant can call.

Concretely, after this service the client can:

- Connect Claude, ChatGPT, Cursor, or any MCP-compatible client to their own MCP endpoint via OAuth
- Use natural language to read site content, update pages or posts, pull inquiries/leads, draft social posts, look up customers/orders/inventory, and run any custom workflow we build
- Optionally embed an in-site chat widget that uses the same MCP tools so their visitors / staff / customers can interact with the business through a chat UI

The MCP server is **separate from their existing website** (so we do not have to rebuild it) but is connected to it through whatever APIs, databases, or admin endpoints the existing site already exposes — or through a small adapter we add.

### Who this is for

- Small and mid-sized businesses with a working website (WordPress, Webflow, Shopify, Squarespace, custom Next.js/Rails/Laravel, etc.)
- Operators who already use AI in their day-to-day and want their AI to actually take action on their business, not just chat
- Teams who want an internal "company copilot" with access to their real data
- Businesses that want to expose a public AI agent (e.g. a concierge / sales agent / support agent) backed by their own systems

### What this service is **not**

- A full website rebuild (see `docs/pricing-guidance.md` for that)
- A generic "ChatGPT plugin" or a hosted SaaS chatbot — the client owns the integration and the data
- A research / R&D engagement — every tool we ship is a concrete, testable capability

---

## 2. Standard MCP Toolset (included in every package)

Every client gets a baseline MCP server with a curated set of standard tools, hardened auth, logging, and an admin console. The standard toolset is grouped into capability bundles. We always include at minimum the **Core Site** and **Inquiries** bundles; the rest are included if the client's site supports them.

### 2.1 Core Site bundle (always included)

- `get_site_content` — read all editable content blocks (hero, about, services, footer, brand)
- `update_site_content` — update content blocks by key/value
- `get_seo_settings` — read meta titles, descriptions, OG/Twitter tags
- `update_seo_settings` — update SEO/metadata
- `get_brand_settings` — read colors, logos, typography
- `update_brand_settings` — update brand settings (where the host site supports it)

### 2.2 Content / Blog bundle

- `list_posts` — list blog/insights/news posts
- `get_post` — read a single post
- `create_post` — draft a new post
- `update_post` — update title, slug, body, status, SEO
- `delete_post` — soft-delete or unpublish
- `publish_post` — flip status to published
- `generate_post_outline` — outline-only helper that doesn't write to the DB

### 2.3 Inquiries / Leads bundle (always included)

- `list_inquiries` — list contact-form / lead submissions, filterable by status
- `get_inquiry` — full details of one submission
- `update_inquiry` — change status, attach a response
- `delete_inquiry` — archive/delete
- `search_inquiries` — search by name, email, message

### 2.4 Social bundle

- `list_social_posts` — list drafts and published social posts
- `create_social_post` — draft a post (Facebook/Instagram/LinkedIn)
- `update_social_post` — edit copy / image
- `publish_social_post` — push to connected accounts (where Meta / LinkedIn / X tokens are configured)

### 2.5 Media / Asset bundle

- `list_media` — list images/files in the site's media library
- `upload_media` — upload an image (returns a URL)
- `delete_media` — delete a media asset
- `reorder_media` — reorder a gallery

### 2.6 Analytics & Search Console bundle

- `query_search_console` — top queries, pages, impressions, clicks, CTR, position over a date range
- `list_search_console_sites` — list verified sites
- `get_traffic_summary` — sessions / pageviews / top pages from GA4 or the site's built-in analytics
- `get_event_summary` — conversion events (form submissions, button clicks)

### 2.7 Admin / Account bundle

- `get_admin_account` — read the connected admin's profile
- `update_admin_account` — update name/email/password
- `list_users` — list users with access
- `invite_user` — send an invite (where the host platform supports it)

### 2.8 Cross-cutting (always on)

- **OAuth 2.1** with Dynamic Client Registration so Claude/ChatGPT/Cursor can connect without manual key handling
- **Per-tool audit log** — every call records who invoked it, when, the arguments, and the result summary
- **Scoped tokens** — read-only vs. read-write scopes, plus per-bundle scopes
- **Rate limiting and abuse protection**
- **Schema-validated inputs** (zod) with descriptive error messages so the AI client recovers gracefully

> Standard tools are versioned. Bug fixes and new standard tools added over time are pushed to all hosted clients automatically as part of their monthly plan.

---

## 3. Custom MCP Tools (scoped per client)

Custom tools are where this service earns its keep. Every business has workflows that aren't covered by the standard bundle. We scope, design, and ship these as a fixed-priced batch.

### 3.1 Common categories of custom tools

- **CRM / pipeline** — `create_deal`, `update_deal_stage`, `log_activity`, `find_contact`
- **Booking / scheduling** — `list_availability`, `create_booking`, `cancel_booking`, `send_reminder`
- **Commerce / inventory** — `list_products`, `update_price`, `update_stock`, `create_discount_code`, `lookup_order`, `refund_order`
- **Quoting / proposals** — `generate_quote`, `send_quote`, `mark_quote_accepted`
- **Email / outreach** — `draft_email`, `send_campaign`, `add_to_segment`
- **Internal docs / KB** — `search_internal_docs`, `summarize_doc`, `update_doc`
- **Finance / billing** — `create_invoice`, `mark_invoice_paid`, `lookup_subscription`
- **Domain-specific** — anything specific to the client's vertical (real-estate listings, photography clients, restaurant menus, fitness class scheduling, etc.)

### 3.2 How we scope a custom tool

Each custom tool is specified as a one-page tool spec before we build it:

1. **Name and one-line purpose** (`reschedule_booking` — moves an existing booking to a new time slot)
2. **Input schema** (zod) with descriptions for every field
3. **Output shape** (what the AI sees back)
4. **Side effects** (what it writes / sends / changes)
5. **Auth scope** (which roles can call it)
6. **Failure modes** (what it does on conflict, unavailable resources, etc.)
7. **Test cases** (3+ realistic invocations the AI client should succeed at)

Custom tools are sized at one of three complexity tiers, used for pricing:

| Tier | Examples | Typical effort |
| --- | --- | --- |
| **Simple** | Read-only lookups, list endpoints, single-record updates against an existing API | 1–3 hours |
| **Standard** | Multi-step writes, validation, side-effects (email/SMS), pagination, light data shaping | 4–8 hours |
| **Complex** | New integration, OAuth dance with a third party, queue/job, multi-record transaction, custom report generation | 10–25+ hours |

### 3.3 Integration with the existing website

We connect the MCP server to the client's existing site through whichever route is cleanest:

- **REST/GraphQL API** — WordPress REST, Webflow CMS API, Shopify Admin API, HubSpot, Stripe, Calendly, Airtable, Notion, custom backend
- **Direct database read/write** — for clients whose site is hosted on a DB we can reach (Postgres/MySQL/SQLite) with proper credentials
- **Headless CMS** — Sanity, Contentful, Strapi, Payload
- **Adapter layer** — for sites without a usable API, we add a tiny endpoint to their site (or a small middleware service) that the MCP server calls

Whichever path we use, the MCP server is the **only** thing that holds the elevated credentials, and every action is logged.

---

## 4. Hosting Options

The client picks one of three hosting models. Most pick **Hosted (Managed)**.

### 4.1 Hosted (Managed) — recommended default

- We run the MCP server on our infrastructure (Vercel serverless, Railway, Fly.io, or AWS depending on workload)
- Custom subdomain on the client's domain (e.g. `mcp.theirsite.com`) via CNAME, with TLS managed for them
- OAuth issuer URL is `https://mcp.theirsite.com`
- We handle deploys, secrets, certificate renewal, dependency updates, log retention, backups, and uptime monitoring
- Included in all monthly plans; no separate hosting line item

**Best for:** clients who do not have a serious DevOps team and want a single monthly bill.

### 4.2 Client-hosted (we build, they run)

- We deliver the MCP server as a Dockerized Next.js / Node service plus a Terraform or step-by-step deploy guide for their cloud (AWS, GCP, Azure, DigitalOcean, Render, Vercel)
- We help them deploy it once on launch
- They own the runtime; we ship updates as PRs to their fork on a cadence they choose
- Source code stays under license — they may modify, but redistribution is not permitted

**Best for:** clients with a security/compliance requirement that their data not leave their infrastructure (HIPAA, certain financial workflows, internal-only tools).

**Pricing impact:** higher one-time setup, lower or zero monthly. See pricing tiers below.

### 4.3 Hybrid (control plane hosted, connector at client)

- We host the MCP server itself, OAuth, and the audit log
- A thin connector / agent runs inside the client's network (or on their existing app server) and is the only thing that touches their database / internal API
- The MCP server calls the connector over an authenticated tunnel

**Best for:** clients whose data lives behind a corporate firewall but who still want hosted convenience and our updates.

### 4.4 What's included in every hosting model

- **TLS** on the MCP endpoint
- **OAuth 2.1 with DCR** so any MCP-compatible AI client can connect
- **Audit log** retained per the plan (30 / 90 / 365 days depending on tier)
- **Health check endpoint** (`/health`) and uptime monitoring
- **Secrets management** — credentials for the client's APIs are stored in the host's secret store, never committed
- **Versioning** — every deploy is tagged; rollback is one command

---

## 5. Pricing

Pricing has two parts: a **one-time setup** for the integration + standard tools + first batch of custom tools, and a **monthly plan** that covers hosting, updates, and a quota of changes.

These ranges follow the same anchoring approach as `docs/pricing-guidance.md`: price to the value of the platform and ongoing responsibility, not just hours.

### 5.1 One-time Setup Tiers

#### Starter MCP Add-On — $2,500–$4,000 one-time

For a simple existing site (WordPress, Webflow, Squarespace, Shopify) where the standard toolset is most of what they need.

Includes:

- Discovery call + tool spec doc (up to 5 standard bundles wired up)
- MCP server provisioned on hosted plan
- OAuth + DCR set up so Claude/ChatGPT/Cursor can connect
- Connection to the existing site's CMS or admin API
- Up to **3 simple custom tools** OR **1 standard custom tool**
- Admin console with audit log
- Up to 2 hours of training + a handoff doc

#### Standard MCP Integration — $5,000–$9,000 one-time

For a serious small business with a real backend (CRM, booking, e-commerce, custom app).

Includes:

- Everything in Starter
- Up to **8 custom tools** across simple/standard tiers (or equivalent in complex points)
- Adapter layer if the existing site does not expose a usable API
- One third-party integration (Stripe / HubSpot / Calendly / Mailchimp / etc.)
- In-site chat widget (optional) wired to the MCP tools
- Role-based scopes (admin / staff / read-only)
- Onboarding workshop (up to 4 hours) + recorded walkthrough

#### Premium / Custom MCP Build — $10,000–$25,000+ one-time

For higher-end clients or anything non-trivial: regulated data, multiple integrations, queues, public-facing AI agent.

Includes:

- Everything in Standard
- Up to **15+ custom tools** including complex-tier work
- Multiple third-party integrations
- Hybrid or client-hosted deployment with infra-as-code
- Custom auth (SAML / SSO) if required
- Public-facing AI agent persona, prompt design, and guardrails
- Full SLA option (see below)

### 5.2 Monthly Plans

Monthly covers hosting (for Hosted/Hybrid clients), automatic updates to standard tools, monitoring, audit-log retention, and a small allotment of changes.

#### Lite — $150/month

- Hosting + TLS + monitoring
- 30-day audit-log retention
- Standard tool updates
- Up to 1 hour of changes / small fixes per month
- Email support, 2 business-day response

#### Care — $300–$450/month

- Everything in Lite
- 90-day audit-log retention
- Up to 3 hours of changes / small custom-tool tweaks per month
- Quarterly review of tool usage and recommendations
- Priority email support, next-business-day response

#### Growth — $750–$1,500/month

- Everything in Care
- 365-day audit-log retention
- Up to 8 hours of changes per month, including new custom tools at simple/standard tier
- Monthly tool-usage and ROI report
- Slack / shared channel support
- Optional uptime SLA

#### Enterprise / SLA — custom (typically $2,000+/month)

- Negotiated SLA (e.g. 99.9% uptime, defined response/restore times)
- Dedicated environment, optional client-hosted deploy
- Security review, pen-test pass-through, SOC 2 questionnaires
- Named contact, scheduled change windows

### 5.3 Add-ons and à la carte

- **Additional simple custom tool** — $250–$500 each
- **Additional standard custom tool** — $750–$1,500 each
- **Additional complex custom tool** — $2,000–$5,000+ each
- **New third-party integration** (Stripe, HubSpot, Calendly, Mailchimp, Twilio, etc.) — $500–$2,000 each
- **In-site chat widget** (if not bundled) — $750–$1,500 setup
- **Migration to a different hosting model** — $750–$2,500
- **Hourly rate for unscoped work** — $75–$125/hour
- **Annual security review** — $500–$1,500

### 5.4 Client-hosted pricing adjustment

Client-hosted deployments shift cost from monthly to one-time:

- Add **+$1,500–$3,000** to the one-time setup (for Docker image, IaC, deploy, runbook)
- Subtract hosting from the monthly plan; "Care" and "Growth" tiers reduce by ~$75–$150/month
- Updates to standard tools are delivered as quarterly PRs by default; on-demand patches billed hourly or via the monthly hours allotment

### 5.5 What's explicitly **not** included

- Building or rebuilding the client's existing website (route them to `docs/pricing-guidance.md`)
- LLM token costs for whatever AI client the customer uses (Claude, ChatGPT, etc.) — those bills are theirs
- Third-party platform fees (Stripe, Twilio, OpenAI API, etc.) — those bills are theirs
- Compliance certifications (SOC 2, HIPAA BAA) unless explicitly scoped under Enterprise

### 5.6 Positioning notes

- Anchor pricing to **operational leverage** ("your AI now actually does the work"), not hours.
- Always quote setup + monthly together. Single-line pricing trains the client to expect ongoing value.
- Avoid quoting under $2,500 setup unless the integration is genuinely trivial — anything cheaper teaches the client this is just a script.
- For prospects who only need a public AI agent (no internal tools), still quote at least Standard tier — the work is in the tooling, not the chat UI.

---

## 6. Delivery Process

Predictable, scoped, and short. Same shape every time so it can be repeated.

1. **Intake call (30–45 min, free).** Confirm the existing stack, top 3 workflows the AI should automate, who will use it (internal-only vs. customer-facing), data sensitivity.
2. **Tool spec + quote (paid discovery if non-trivial, $500–$1,000 credited toward setup).** One-page spec per tool, list of standard bundles enabled, hosting choice, fixed quote.
3. **Kickoff + access.** Client provisions API keys / DB credentials / CMS access into a shared secret vault. We provision the MCP server.
4. **Build.** Standard bundles wired up first, custom tools second, in agreed batches with a working preview environment.
5. **Connect AI client.** Walk the client through connecting Claude / ChatGPT / Cursor / their internal copilot via OAuth.
6. **Acceptance.** Each tool is demonstrated against its test cases.
7. **Launch.** Production cutover, custom domain (`mcp.theirsite.com`), monitoring on, audit log on.
8. **Handoff.** Recorded walkthrough, written runbook, onboarding workshop.
9. **Monthly cadence.** Status email, usage report, hours used, queued requests.

---

## 7. Sample Quote Templates

### Template A — Service business with Webflow + HubSpot

- Setup: **$6,500** (Standard MCP Integration)
  - Standard bundles: Core Site, Content/Blog, Inquiries, Media, Analytics
  - Custom tools (8): `find_contact`, `create_deal`, `update_deal_stage`, `log_activity`, `list_availability` (Calendly), `create_booking`, `send_quote`, `mark_quote_accepted`
  - HubSpot + Calendly integrations
- Monthly: **$300/month** (Care plan)
- Hourly for new tools: **$95/hour** or per-tool quote

### Template B — Shopify store with internal ops needs

- Setup: **$4,500** (Starter+)
  - Standard bundles: Core Site, Content/Blog, Media, Analytics, Inquiries
  - Custom tools (5): `lookup_order`, `update_stock`, `create_discount_code`, `refund_order`, `top_products_report`
  - Shopify Admin API integration
- Monthly: **$300/month** (Care plan)
- Hourly for new tools: **$95/hour**

### Template C — Real-estate / photography / portfolio (mirrors this codebase)

- Setup: **$5,000** (Standard MCP Integration), all standard bundles
- Monthly: **$350/month**
- Add-on tools quoted from §5.3 as needed

### Template D — Regulated / client-hosted

- Setup: **$15,000** (Premium, client-hosted)
  - All standard bundles + 12 custom tools incl. complex tier
  - Client-hosted on their AWS, IaC delivered
- Monthly: **$750/month** (Growth, hosting line removed, hours retained)
- Annual security review: **$1,000**

---

## 8. Risks and how we price for them

- **Client's existing site has no usable API** — we have to add an adapter. Always inspect their stack on the intake call; if no API, add $750–$2,000 to the setup quote.
- **Credential sprawl** — clients sometimes don't have admin credentials to their own CMS. Block kickoff until secrets are in the vault.
- **Scope creep on custom tools** — every tool is fixed-price against its spec doc; changes after spec sign-off are billed hourly or as a new tool.
- **Rate limits on third-party APIs** — note them in the spec; if a tool needs caching/queueing to be reliable, that's a complex-tier tool.
- **AI client regressions** — Claude / ChatGPT / Cursor occasionally change their MCP client behavior. Maintenance against those changes is what the monthly plan funds.

---

## 9. Quick reference card

| Item | Range |
| --- | --- |
| Starter MCP Add-On | **$2,500–$4,000** setup |
| Standard MCP Integration | **$5,000–$9,000** setup |
| Premium / Custom MCP Build | **$10,000–$25,000+** setup |
| Lite monthly | **$150/mo** |
| Care monthly | **$300–$450/mo** |
| Growth monthly | **$750–$1,500/mo** |
| Enterprise / SLA monthly | **$2,000+/mo** |
| Simple custom tool | **$250–$500** each |
| Standard custom tool | **$750–$1,500** each |
| Complex custom tool | **$2,000–$5,000+** each |
| Third-party integration | **$500–$2,000** each |
| Client-hosted setup adder | **+$1,500–$3,000** |
| Hourly (unscoped) | **$75–$125/hour** |

---

## 10. Related documents

- `docs/pricing-guidance.md` — full website builds (use this when the client does **not** already have a working site)
- `mcp/tools.ts` — the actual standard toolset shipped from this codebase, useful as a reference when scoping a new client
- `mcp/server.ts`, `mcp/oauth.ts` — the production MCP + OAuth implementation that backs the Hosted offering
