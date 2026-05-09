# LaserHub Platform Audit & Improvement Plan

**Date**: 2026-04-17
**Method**: Live walk-through via Chrome DevTools MCP (every major route, desktop 1280×800) + three parallel code-audit agents (frontend, backend, dev-data leaks) + 1 perf trace.
**Scope**: Everything behind `http://localhost:5173` and `http://localhost:8000`. Screenshots saved to `test-images/audit-2026-04-17-*.png` (33 pages captured).
**Status of prior plans**: UX_OVERHAUL_PLAN.md and TASKS.md are implemented. This audit reveals the second layer — real defects and polish gaps now visible now that the scaffolding is in place.

---

## Executive Summary

LaserHub is functionally complete as an MVP — every major flow (browse → design → upload → configure → quote → order → admin → super-admin) works end-to-end with real data. The top defects below are **not structural**; they are integration gaps where pieces don't talk to each other (currency switcher is ignored in 10+ places), seed-data leaks (Validation Test, USD rates, hardcoded member-since dates), and several **auth holes in the backend** that need immediate attention before any production exposure.

**Health scoreboard (subjective):**

| Area              | Score | Notes |
|-------------------|-------|-------|
| Feature coverage  | 9/10  | Basically everything the roadmap asked for is present |
| UI polish         | 7/10  | Design system applied, a few clear regressions |
| Data integrity    | 5/10  | Demo data leaks to public routes, currency rendering broken |
| Auth/authz        | 4/10  | Multiple endpoints accept arbitrary `user_id` params, vendor routes missing auth |
| Perf              | 8/10* | Dev-mode LCP 1.4s, CLS 0 — will be much better in prod. Not measured under throttling yet |
| Accessibility     | 6/10  | Skip-link + aria regions present, but nested interactive elements, missing alt, some `<div onClick>` |
| Observability     | 3/10  | No Sentry / uptime / structured traces yet (Phase 0 item on ROADMAP) |

*Perf is approximate; see §11 for the caveats.

---

## Cross-Cutting Themes (fix once, fix everywhere)

These are the highest-leverage items — each theme touches 5+ files.

1. **Currency rendering is fractured.** Zustand `currencyStore` and `formatPrice()` exist (`src/store/currencyStore.ts`) but are bypassed in the upload configure step, material compare page, material wizard, admin/vendor dashboards, order forms, and Stripe/Razorpay pay buttons. Every hardcoded `$${x.toFixed(...)}` in JSX (≈15 sites) must go through `formatPrice`.
2. **Dev/demo data leaks to public.** "Validation Test" material, seed vendors named like test accounts, hardcoded "Member since March 2026", USD rates with no `currency` column. Needs a DB cleanup + an `is_internal` / `is_test` flag + a `SEED_DEMO_DATA` env gate.
3. **Auth holes on write endpoints.** `designs.create_design` hardcodes `creator_id=1`; `vendor.register_vendor` hardcodes `user_id=1`; `designs.like` accepts a `user_id` query param; `vendor.update_vendor_tags` has no auth at all. Server-side trust of request-supplied `user_id` is pervasive.
4. **Secrets in repo.** `backend/.env` is committed with live Razorpay, Google OAuth, VAPID, and Stripe webhook keys. Rotate everything before we think about anything else.
5. **Page `<title>` is static** on all routes ("LaserHub - Laser Cutting Cost Calculator"). Easy SEO + UX win with a `useDocumentTitle` hook.
6. **Footer clutter.** Six external `hjlabs.in` product links appear on every page; rely on them being relevant only on /about or a single "More tools" dropdown.
7. **Duplicate UI primitives directory** (`src/components/ui/index.ts` vs `index.tsx`) + several orphaned components and pages never mounted in the router.
8. **N+1 queries** in order list, admin dashboard, and marketplace browse — 2+ queries per row instead of eager-loaded joins.

---

## 1 · Public Marketplace Pages

### 1.1 Homepage (`/`)

Screenshot: `test-images/audit-2026-04-17-01-home.png`

- **Featured Designs**: the first card ("Laser Cut Earrings Set", design 4) has **no thumbnail** — grid icon placeholder only. Design 5 ("Mechanical Gear Set") also missing on Browse. Seed-data gap (see §B2).
- **Top Vendors cards** have initials avatars only (PC / AS / EW / SI). No logos, no specialties, no turnaround badges — cards feel placeholder-ish. `MarketplacePage.tsx:80-86` filters demo vendors by *name matching* (fragile — see §2.2).
- **"Ready to Buy" cards** are nested buttons: the outer card is a `<div role="button" onClick>` and the inner "Buy" is a real `<Button>`. Double tab stop, ambiguous click target, invalid HTML. (`MarketplacePage.tsx:322-367`)
- Same design shows up 2–3× in "Ready to Buy" (same design, different material/thickness). Dedupe by design_id and collapse material options into a single card.
- **Categories row** has 8 chips — 7 fit on one line, 8th ("Education") wraps alone. Add `flex-wrap` + even distribution or tighten spacing.
- **Footer** carries 6 external product links on every page. Move behind a "More Tools" disclosure or show only on /about.

### 1.2 Browse Designs (`/browse`)

Screenshot: `test-images/audit-2026-04-17-02-browse.png`

- **Two filter rows** compete: category chip bar (9 items) + tag bar (20+ `#hashtag` buttons). `BrowseDesignsPage.tsx:231-243, :245-266`. Collapse the tag bar behind "Filters" or show top 5–8 tags only.
- **Anchor-wrapping-button** anti-pattern: the whole card is a `<Link>`, tag `<button>`s are nested inside. Tag clicks trigger both navigation + filter. Convert tags to `<span>` with keyboard handlers + `stopPropagation`. (`BrowseDesignsPage.tsx:345,370-380`)
- Inconsistent footer: some cards show "From ₹X", others "Quote on order". The latter means no `DesignListing` rows exist for that design — see §B2.
- Missing thumbnails on 2 designs (same as homepage).
- Search placeholder claims "Search designs, materials, vendors…" on homepage but "Search designs…" on Browse — set expectations consistently.

### 1.3 Vendors List (`/vendors`)

Screenshot: `test-images/audit-2026-04-17-03-vendors.png`

- Clean: search + location filter + rating filter all present. Demo vendors ("Hemang Joshi's Shop", "Admin User's Shop") are no longer visible (client-side filter at `MarketplacePage.tsx:80-86` excludes them — but see §2 for a proper server-side fix).
- Cards still use initials avatars; adopt real placeholder imagery (geometric gradient keyed on vendor_id).
- No specialty chips; vendor profile tables hint at material focus — surface it on the card.

### 1.4 Vendor Profile (`/vendor/:slug`)

Screenshot: `test-images/audit-2026-04-17-04-vendor-profile.png`

- **Duplicate `<h1>`**: "Precision Laser Co." appears twice as level-1 heading (`VendorProfilePage.tsx:148` via PageHeader + `:161` inside hero). Delete the hero `<h1>`, keep PageHeader.
- "Member since March 2026" is every seeded vendor's default `datetime.utcnow()` at seed time (`seed_marketplace.py` never sets `created_at`). Seed with realistic spread dates.
- Tabs: Materials / Listings / Reviews / About — all populated for this vendor. Good. Default tab "Materials" shows a solid table; "Lead Time" column repeats "2 days" across rows.
- "CUSTOM PRICE" column shows `₹4.17 / cm² · mm` — format is correct here (INR resolved). But `/upload` Configure step and `/materials/compare` regress to `$` — see §2.

### 1.5 Design Detail (`/design/:id`)

Screenshots: `05-design-detail.png` (design 1), `06-design-9.png` (design 9)

- **Listings table only shows up for ~half the designs.** Design 1 has no listings (only Category in SPECS); design 9 has 2 listings. Seed-data gap (`seed_marketplace.py:220-231` creates 8 designs with `file_id=1` and never inserts DesignListing rows; `seed_designs.py` handles a different set).
- **SPECS sidebar is thin.** Only Category shown. Fields exist in the schema (dimensions, area, cut length, complexity, file format) but endpoint doesn't return them. Backend: enrich `/api/marketplace/designs/{id}` to include UploadedFile metadata.
- No "Related Designs" scrolling rail — show 4+ related not just 1.
- No size / scale controls for the preview; the SVG renders at its native size.

### 1.6 Material Wizard (`/material-wizard`)

Screenshot: `07-material-wizard.png`

- Route inconsistency: wizard is at **`/material-wizard`** (singular, no `s`) but compare is at **`/materials/compare`** (plural). Standardize on `/materials/wizard` and add a redirect.
- Wizard flow works; recommendations display correctly.

### 1.7 Material Compare (`/materials/compare`)

Screenshot: `08-material-compare.png`

- **Currency still USD**: "`$0.050/cm² · `" (trailing dot + missing thickness unit). `MaterialComparePage.tsx:92,113` hardcodes `$`. Replace with `formatPrice`.
- **"Validation Test" material visible** to public — leaked from admin QA. Filter removed from `MaterialManager.tsx:123` but backend still serves it (`app/api/materials.py:73-82`). Add `is_internal` column + server-side filter.
- **Star ratings are all `★★★☆☆`** because `strengthLabel(rating: number = 3)` defaults to 3 when backend returns null. Show "— Not rated" when nullish.
- Wizard link points to `/material-wizard` — confirm it matches route.
- Display malformed `"Acrylic : Any Color"` (space before colon) — seed name issue.

---

## 2 · Upload Flow (`/upload`)

Screenshots: `09-upload-step1.png` → `12-upload-step3.png`

Flow tested: upload → configure → review. Order step requires login and a real payment method.

### 2.1 Step 1 — Upload
- Clean dropzone, format chips (SVG/DXF/AI/PDF/EPS/CDR), copyright notice, file-size cap shown. Good.
- After file upload, preview loads from `/api/upload/{uuid}/raw`. 683 KB SVG previewed correctly.

### 2.2 Step 2 — Configure
- **Material cards show `$0.050/cm²`** — currency switcher is ignored on this page. (`MaterialSelector.tsx:199`)
- **"Validation Test" material in the grid** — same as §1.7.
- **Sample pack callout hardcodes `₹299`** — non-INR users see rupees regardless of their currency. Use `formatPrice`.
- **Thickness buttons show just "3", "5", "10"** — "mm" only in title attribute. Show the unit on the label. (`MaterialSelector.tsx:222`)
- **Quantity input has `valuemax="0"`** exposed to assistive tech — no upper bound set. Set `max={999}`. (`MaterialSelector.tsx:237-242`)

### 2.3 Step 3 — Review
- 3D preview renders an SVG with 1231 shapes; "Complex design — simplified rendering" callout correctly shown.
- Analysis panel: **1458 issues / Score 0/100** on the test file — that's the genuine complexity, but the UI offers no "Fix automatically" action or concrete first issue. Surface the top 3 issue categories + a "Simplify" toggle.
- Cost breakdown: `Material ₹36,715`, `Laser ₹2,382`, `Energy ₹0.83`, `Setup ₹417.50`, `Subtotal ₹39,515`, `Tax ₹3,161`, `Total ₹42,676`. **This page formats INR correctly** — the difference vs step 2 is that step 3 uses `CostDisplay.tsx` which already uses `formatPrice`.
- Compare Vendor Quotes (2) — sort dropdown + BEST badge + Save quote works.

### 2.4 Step 4 — Order (not tested live)
- Stripe / Razorpay pay buttons in `OrderForm.tsx:488-490` display `$` regardless of currency — misleads a user paying INR on Razorpay. Use `formatPrice`.

---

## 3 · Auth + Profile

Screenshot: `13-login.png`, `14-post-login.png`

- **Login page is the strongest**: 2-col layout (form + "Why LaserHub" benefits). Google SSO works (iframe loads).
- After login as admin, redirect works (to `/`).
- **No v7 future flags** on `<BrowserRouter>` — console shows 2 deprecation warnings. (`App.tsx:315`) One-line fix.
- Push notification prompt banner appears immediately after login; add a cooldown (don't ask until 2nd visit or post-first-order).
- `/profile` for vendors redirects to `/admin/dashboard` — this is fine, but `/profile` for a plain customer role wasn't tested here.
- **Axios 401 interceptor clears tokens silently** — user stays on protected pages with broken state. Redirect to `/login?next=...`. (`src/services/api.ts:81-100`)

---

## 4 · Admin / Vendor Dashboard

Screenshots: `15-admin-dashboard.png` → `24-admin-team.png`

- **Sidebar is clean**: sections split Profile / Vendor / (common). Navigates correctly.
- **Dashboard stats**: Total 5, Pending 1, Revenue ₹46,663, This Month ₹46,663. Real data.
- **Customer names are clearly test data**: "Test User", "fgdfgsdf", "he", "dfghdgf", "sdfg2@dfs.com". Clean from DB before launch.
- Order status dropdowns work in place. "Track" button next to each order opens event posting.
- Missing: date-range filter, CSV export button, search over order ID / email.
- Analytics page has real donut + bars.
- Inventory, Team, Customers, Financials, Quotes pages render — minimal data, mostly shells.
- **Every vendor can call `/api/admin/*`** because `admin.get_current_admin` returns true for any `role in ("vendor", "super_admin")` (`app/api/admin.py:95`). Should split into `require_platform_admin` vs `require_vendor`. High severity.

---

## 5 · Super Admin

Screenshots: `25-sa-users.png` → `28-sa-stats.png`

- Route `/super-admin` silently redirects to `/admin/sa-users`. Works but surprising.
- **`SUPER_ADMIN_EMAIL` is hardcoded in 4 places**: `backend/app/core/config.py:63`, `frontend/src/App.tsx:78`, `AdminPage.tsx:61`, `SuperAdminPage.tsx:51`. Client-side role check by email string is bypassable; consolidate to a `user.role === 'super_admin'` server-trusted flag.
- SuperAdmin page is **1553 lines**. Split into feature modules.
- Users table has role dropdown + verified + delete. Delete has no confirmation dialog.

---

## 6 · Legal + Content

Screenshots: `29-about.png`, `30-contact.png`, `31-privacy.png`, `32-terms.png`, `33-refund.png`

- Privacy / Terms / Refund pages look solid: sticky TOC, Print button, callouts. "Last updated" dates present.
- **Email `hemangjoshi37a@gmail.com` is repeated 5× in Privacy** — fine, but use a single `CONTACT_EMAIL` constant.
- Print button exists only on Privacy (not Terms/Refund). Add consistently.
- About page: hero is text-heavy, no imagery of laser work; add a photo grid or example designs gallery.
- Contact page: form is mailto-based; "Send Message" should say "Opens your email client" explicitly, or switch to a real POST endpoint.

---

## 7 · Performance (single data point, dev mode)

Homepage reload trace (no throttling):

- **LCP**: 1,386 ms (1,372 ms of render delay + 14 ms TTFB)
- **CLS**: 0.00 (excellent)
- **TTFB**: 14 ms

Production bundle + CDN will cut LCP substantially; Three.js is the largest single dep and is eagerly imported in `HomePage.tsx:8`. Next pass:

- Code-split `DesignPreview3D` via `React.lazy` so it only loads on step 4.
- Run Lighthouse under 4× CPU throttling + Slow 4G.
- Add a full CrUX-style budget target: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.

---

## 8 · Accessibility (quick sweep)

- Skip-link + ARIA landmarks (main, navigation, contentinfo, region "Notifications") are in place.
- **Nested interactive elements** on Ready-to-Buy cards + Browse cards (§1.1, §1.2).
- **Missing alt text** on some SVG preview `<image>` nodes.
- **No `prefers-reduced-motion` handling** for the 3D viewer auto-rotate (`DesignPreview3D.tsx:43`).
- **Divs used as buttons** in MaterialSelector (`:177-201`) — needs `<button>` or role + keyDown.
- No focus trap in currency dropdown or user-menu dropdown.

---

## 9 · Security (highest severity issues, verified by code audit)

These are the items to fix before any public launch. They are not all visible from the UI; they come from the backend audit agent.

### 9.1 CRITICAL

1. **Live Razorpay / Google OAuth / VAPID / Stripe webhook secrets committed** to `backend/.env`. Rotate every key; add to `.gitignore`; move to a secrets manager or env-only injection.
2. **`DEFAULT_SECRET_KEY = "change-this-secret-key-in-production"`** in `backend/app/core/config.py:21` — startup only warns, doesn't refuse to boot. Raise if `ENVIRONMENT != "development"` and key is default.
3. **Seed passwords are `demo123`** for 4 demo vendors (`seed_marketplace.py:22,40,58,77`). Gate seed scripts behind `if ENVIRONMENT == "development"`.
4. **`POST /api/payment/test-credentials`** accepts arbitrary Stripe/Razorpay credentials and attempts to use them (`payment.py:272-316`). Allows credential enumeration. Add `@require_admin_role`.
5. **`designs.create_design` hardcodes `creator_id=1`** (`designs.py:41`) and **`vendor.register_vendor` hardcodes `user_id=1`** (`vendor.py:88`). Anyone can create designs/vendors as the first user.
6. **`designs.like` accepts `user_id` as query parameter** (`:83`) — anyone can like on behalf of anyone. Same pattern in `get_my_designs`.
7. **`marketplace.create_vendor_review`** ignores auth and stores `user_id=0` for anonymous reviews (`marketplace.py:405-438`). Orphan FK, anonymous inflation possible.
8. **`vendor.update_vendor_tags` has no auth** (`vendor.py:469-485`) — any caller can rewrite any vendor's specialties. Same for `designs.update_design_tags` and `designs.toggle_design_sharing`.
9. **`/api/vendors/register/{user_id}`** (`vendor.py:101-139`) — unauthenticated caller can promote any user to vendor.

### 9.2 HIGH

10. **`admin.get_current_admin` authorizes any vendor as admin** (`admin.py:95`). Split `require_platform_admin` vs `require_vendor`.
11. **`tracking.upload_order_photo`** validates extension only — no magic-byte check (`tracking.py:347-376`).
12. **Stripe/Razorpay webhook replay**: signatures verified but event IDs not deduped. Track processed event IDs.
13. **`auth.google_login` returns 500 with `str(e)`** — leaks internal text (`auth.py:184`).
14. **`payment.create_payment_intent` catches `Exception` and returns `400 str(e)`** — echoes Stripe errors verbatim.

---

## 10 · Data Integrity / Demo Leaks

1. **"Validation Test"** material in DB — delete from DB and add server-side filter, not client-side (§1.7).
2. **"Admin User" authorship** on 8 featured designs + "Alex Chen" on 8 more → fine as seed content but add a `is_demo` flag so we can hide behind `SEED_DEMO_DATA=true` in prod.
3. **Seed `file_id=1` placeholder** — explains missing thumbnails on designs 4 and 5 (§1.1).
4. **Material rates stored as floats with no currency column** (`app/scripts/seed_data.py:25-84`, `app/models/__init__.py` Material). Add `currency` column, default USD, convert at response time.
5. **"Member since March 2026"** on every seeded vendor → seed script never sets `created_at`, takes `datetime.utcnow()`. Seed with staggered historical dates.
6. **Duplicate `guest_tracking_token` column** declared twice in `Order` model (`models/__init__.py:145, :148`). Harmless but sloppy.
7. **Hardcoded `currency: "usd"`** in `admin.seed_payment_settings` (`admin.py:811`). Make it env-driven.

---

## 11 · Frontend Quality Hot-spots

From the frontend agent — selected highlights not already covered:

1. **Duplicate UI primitives directory**: `src/components/ui/index.ts` vs `index.tsx` (bundler uses .ts; .tsx is ~300 LOC of dead code). Delete `index.tsx` after confirming no imports.
2. **Orphaned pages**: `DashboardPage.tsx`, `VerifyEmailPage.tsx`, `ForgotPasswordPage.tsx` are exported but not routed.
3. **`SORT_OPTIONS` / `CATEGORIES` duplicated** across BrowseDesignsPage, MarketplacePage, DesignDetailPage → extract to `src/utils/taxonomy.ts`.
4. **Copyright year `© 2026` hardcoded** — use `new Date().getFullYear()` (`App.tsx:304`).
5. **`App.css` is 11,210 lines** — split into CSS modules per feature.
6. **40+ `any` / `as any` casts**, especially in VendorDashboardPage and MaterialSelector props.
7. **No React Error Boundary** wrapping `<Routes>` — a crash trashes the app. `ErrorFallback.tsx` exists but isn't wired.
8. **No `useDocumentTitle` hook** — every page has the same `<title>`. See §0.5.

---

## 12 · Backend Quality Hot-spots

From the backend agent — selected highlights not already covered:

1. **N+1 queries** in `orders.list_orders:328-355`, `admin.list_all_orders:176-178`, `auth.list_my_orders:295-322`, `marketplace.browse_designs:201-212`. Add `selectinload(...)` eager loads.
2. **`get_db()` auto-commits** on yield (`core/database.py:58-59`) — combined with explicit endpoint commits, causes double commits and masks rollback omissions. Remove the blanket commit.
3. **SQLite-specific `func.strftime`** in analytics (`admin.py:397, 668`) — breaks on Postgres.
4. **Blocking I/O in async**: `open(...).write(content)` on 50 MB uploads (`upload.py:215`), `subprocess.run(inkscape/ghostscript...)` in `file_converter.py:62,79,109`. Move to `aiofiles` / `run_in_threadpool`.
5. **Rate limiter uses in-memory store** — ineffective across multiple workers. Point at Redis.
6. **`decode_access_token` bypassed in vendor routes** — `vendor.get_current_vendor:51` calls `jwt.decode` directly, skipping `iss` validation enforced in `security.decode_access_token`.
7. **Order status enum mismatch**: Pydantic `OrderStatus` (`schemas/__init__.py:41-47`) omits `accepted`/`shipped`, but `VALID_STATUSES` in admin.py includes them. Kanban drags will 422.
8. **CSV export route collision risk**: `/api/admin/orders/export` vs `/api/admin/orders/{order_id}` — works only because of registration order.

---

## Execution Plan

Ordered from highest ROI / lowest risk to larger lifts. Items marked [PARALLEL] can run in independent worktrees.

### Phase A — Bleeding (1–2 days, blocking)

1. **Rotate all keys** in `backend/.env`, add to `.gitignore`, move to secrets manager. Commit a sanitized `.env.example`.
2. **Refuse-to-boot** on default `SECRET_KEY` in non-dev (`config.py:21`).
3. **Gate seed scripts** behind `ENVIRONMENT=development`.
4. **Auth on write endpoints** [PARALLEL]: patch `designs.create_design`, `designs.like`, `designs.update_design_tags`, `designs.toggle_design_sharing`, `vendor.register_vendor`, `vendor.update_vendor_tags`, `marketplace.create_vendor_review` to require JWT and use `current_user.id`.
5. **Require auth on `/api/payment/test-credentials`**.
6. **Split `require_platform_admin` vs `require_vendor`** (`admin.py:95`).

### Phase B — Integrity (2–3 days)

7. **Currency layer** [PARALLEL]:
   - Backend: add `currency` column to Material, MaterialConfig, DesignListing; default "USD"; expose `GET /api/pricing/context`.
   - Frontend: replace every `$${x.toFixed(...)}` with `formatPrice(x, currency)` (see frontend agent's finding #1 for exhaustive list). Add an ESLint rule or CI grep gate that forbids hardcoded `$` in JSX.
8. **Demo data cleanup** [PARALLEL]:
   - DELETE "Validation Test" from DB, remove `MaterialManager.tsx:123` client filter.
   - Add `is_internal` / `is_demo` flags to Material + Design + Vendor.
   - Gate `seed_marketplace` / `seed_designs` behind `SEED_DEMO_DATA=true`.
   - Staggered historical `created_at` for demo vendors so "Member since" isn't all March 2026.
9. **Seed design listings**: ensure every seeded design gets at least 1 `DesignListing` row so "Quote on order" disappears for designs 1–8.
10. **Thumbnails for designs 4 and 5**: update seed to reference real SVGs or drop them.
11. **N+1 fixes** [PARALLEL]: add `selectinload` in orders/admin/marketplace list endpoints.

### Phase C — UX polish (3–5 days, can parallelize across pages)

12. **[AGENT A — shared infra]**
    - Delete `src/components/ui/index.tsx` (dead), PageHeader breadcrumbs to react-router `<Link>`.
    - Add `useDocumentTitle` hook + per-page titles.
    - Add React Error Boundary around `<Routes>` using existing `ErrorFallback.tsx`.
    - Set React Router v7 future flags.
    - Extract `taxonomy.ts` for SORT_OPTIONS / CATEGORIES.

13. **[AGENT B — marketplace pages]**
    - Homepage: dedupe Ready-to-Buy by design_id; unflatten nested buttons.
    - Browse: collapse tag bar behind a "Filters" disclosure; move tag buttons out of card anchors.
    - Vendor cards: real placeholder imagery (gradient keyed on vendor_id), specialty chips.
    - Footer: single "More Tools" dropdown.

14. **[AGENT C — upload flow]**
    - MaterialSelector: use `formatPrice`, show "mm" on thickness labels, set quantity max=999, fix `<button>` accessibility.
    - Review step: surface top 3 issue categories with "Fix automatically" stub.
    - OrderForm: use `formatPrice` on Stripe/Razorpay pay buttons.

15. **[AGENT D — admin dashboards]**
    - Remove test customer rows from display (filter by `is_test` or seed cleanup).
    - Date-range filter + CSV export button on Orders.
    - Break up `SuperAdminPage.tsx` (1553 lines) into feature modules.
    - Confirm dialog on delete user / delete design.

16. **[AGENT E — design detail + vendor profile]**
    - Remove duplicate `<h1>` on VendorProfilePage.
    - Enrich `/api/marketplace/designs/{id}` response with dimensions/area/cut length.
    - Show "Related Designs" rail with 4+ items.

### Phase D — Perf + Observability (2–3 days)

17. **Code-split `DesignPreview3D`** via `React.lazy` + Suspense.
18. **Lighthouse CI** gate on PRs (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1).
19. **Sentry + uptime ping** (Phase 0 item on ROADMAP — still pending).
20. **Structured logging** via `structlog` across all endpoints.
21. **Rate limiter → Redis**.

### Phase E — Tests + CI (2 days)

22. Backend: add auth regression tests for all endpoints the audit flagged.
23. Frontend: Playwright golden-path tests for buyer upload → order and vendor login → order management.
24. Playwright visual regression against `test-images/audit-2026-04-17-*.png` as a baseline.

---

## Suggested Agent Fan-Out (for the next implementation pass)

| Agent | Scope | Files |
|-------|-------|-------|
| A | Shared infra (title hook, error boundary, router flags, dead code) | App.tsx, App.css, src/components/ui/, src/hooks/ |
| B | Marketplace pages (Home, Browse, Vendors list) | MarketplacePage.tsx, BrowseDesignsPage.tsx, VendorsPage.tsx |
| C | Upload flow (Steps 2, 3, 4) | MaterialSelector.tsx, CostDisplay.tsx, OrderForm.tsx |
| D | Admin + Super Admin | AdminPage.tsx, SuperAdminPage.tsx, VendorDashboardPage.tsx |
| E | Design detail + Vendor profile | DesignDetailPage.tsx, VendorProfilePage.tsx |
| F | Backend currency layer | models/, schemas/, api/materials.py, api/marketplace.py |
| G | Backend auth hardening | api/designs.py, api/vendor.py, api/marketplace.py, core/security.py |
| H | Seed data + demo flags | scripts/seed_*.py, models/, core/config.py |

Run A, B, C, D, E, F, G, H in parallel worktrees. Expected total elapsed time: 5–7 working days if all agents execute cleanly.

---

## Open Questions for the Owner

1. **Public launch target date?** — the CRITICAL security items are blockers.
2. **Multi-currency strategy**: convert at response time using a live FX rate, or store vendor prices per-currency? (The former is simpler; the latter is what SendCutSend does.)
3. **Demo data policy in prod**: do we want *any* seed designs visible (as marketing content) or do we wait for real users to create them?
4. **`admin@laserhub.com`** default admin — rotate and remove the hardcoded password fallback (`admin.py:123`) before launch.
5. **`hemangjoshi37a@gmail.com`** as super admin: keep as primary, or use a role-based `super_admin` role flag only?

---

**Screenshots index**: all in `test-images/audit-2026-04-17-*.png` (33 images, numbered 01–33).

**Next step**: review this plan, pick which agent groups to launch, and go.
