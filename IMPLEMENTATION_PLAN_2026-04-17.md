# LaserHub — Implementation Plan (Agent-Ready, Parallel Execution)

**Companion to**: `PLATFORM_AUDIT_2026-04-17.md`
**Date**: 2026-04-17
**Purpose**: Convert the audit findings into a **phase-wise, parallelizable, pin-point task plan** that coding sub-agents can execute without improvising. Every task below has an exact file path, exact change, exact verification command, and exact done-when criterion. An agent that deviates from this plan is wrong.

---

## 0. How to Use This File

### 0.1 Rules for every sub-agent (non-negotiable)

1. **Stay in your lane.** Each agent has an explicit `Owns:` list and a `Do-not-touch:` list. Do not modify files outside `Owns:`. If you need a shared contract, **read it from §1 Shared Contracts** — do not invent a new one.
2. **No scope creep.** Do not refactor unrelated code. Do not rename variables for "style". Do not add features not listed. Do not create new abstractions unless the task explicitly says so. If a task says "replace `$` with `formatPrice`", that is the entire change.
3. **No new files unless the task says so.** The plan names every new file that should exist. If you think a new file is needed that isn't listed, stop and ask.
4. **Small, reviewable commits.** One commit per task ID (e.g., `[SEC-01] rotate secrets and add boot check`). Commit message must start with the task ID in brackets.
5. **Run the verification command in `Verify:` before marking done.** If it fails, do not mark complete.
6. **Follow the existing conventions** listed in §2. Do not impose new conventions.
7. **Integration tests live with the owner of the endpoint/component**, not with the consumer.
8. **`git status` must be clean** (staged and committed) before handoff.

### 0.2 Branch / worktree strategy

- One git worktree per agent, branch name = agent ID lowercased (e.g., `agents/sec`, `agents/cur-be`).
- Merge target: `main`.
- Merge order follows the phase order (§3 → §4 → §5). Do not merge out of order.
- Shared contracts in §1 land on `main` first via **Phase 0.5 — Contracts** (single small PR by the operator, not an agent).

### 0.3 Priority legend

- **P0** = blocks launch (security). Serial-like, one agent at a time inside the security package.
- **P1** = data integrity. Parallelizable within the package.
- **P2** = UX polish. Highly parallelizable across pages.
- **P3** = perf + observability + tests. Mostly parallel.

### 0.3.1 Completion log (auto-updated as tasks land)

Tasks are struck through by the operator when their commit merges to `main`. Current state:

| Task | Status | Commit | Scope |
|---|---|---|---|
| SEC-02 | ✅ done | `fc00fd5` | Refuse-to-boot on default `SECRET_KEY` / `ADMIN_PASSWORD` outside dev |
| SEC-10 | ✅ done | `3f86898` | Pillow magic-byte validation on order photo upload |
| UI-A-02 | ✅ done | `304ee7c` | `useDocumentTitle` hook + test |
| UI-A-04 | ✅ done | `8667a01` | React Router v7 future flags |
| UI-A-05 | ✅ done | `dc57054` | Axios 401 → `/login?next=...` with path preservation |
| UI-A-06 | ✅ done | `8667a01` | Remove duplicate "Home" nav link |
| UI-A-08 | ✅ done | `8667a01` | Dynamic `{new Date().getFullYear()}` copyright |
| UI-A-11 | ✅ done | `9709c30` | PageHeader breadcrumbs → react-router `<Link>` |
| UI-B-06 | ✅ done | `fe86f6f` | Deterministic gradient avatar on vendor cards |
| UI-C-02 | ✅ done | `8868333` | Thickness button labels show " mm" |
| UI-C-03 | ✅ done | `8868333` | Quantity input `min=1 max=999` |
| UI-C-04 | ✅ done | `8868333` | Material card is `<button>` not `<div onClick>` |
| UI-E-01 | ✅ done | `a0cfa5f` | Remove duplicate `<h1>` on VendorProfilePage |
| SEED-05 | ✅ done | `a4de3c7` | Strip duplicate `guest_tracking_token` column on `Order` |
| SEED-02 | ✅ done | `b99fa45` | Seed demo vendors with deterministic staggered `created_at` |
| PERF-DB-06 | ✅ done | `159bfc1` | Cap `limit` query params with `Query(ge=1, le=200)` in orders / admin / marketplace |
| UI-A-09 | ✅ done | `15186f2` | Extract taxonomy constants to `src/utils/taxonomy.ts` |
| UI-A-10 | ✅ done | `9e5e0e1` | `isSuperAdmin` / `isVendor` helpers in `src/utils/roles.ts` |
| UI-A-01 | ✅ done | _(no commit; file was never tracked)_ | Delete dead duplicate `src/components/ui/index.tsx` (300 LOC dead code) |
| PERF-DB-07 | ✅ done | `67bb594` | Rate limiter uses `REDIS_URL` when set, falls back to in-memory |
| SEC-12 | ✅ done | `13b944d` | Structured `auth.unauthorized` log on every 401 (live-verified) |
| PERF-DB-04 | ✅ done | `d1103f8` | `aiofiles` async write on upload body (no more event-loop block) |

**Batches 4 + 5 complete** (status: changes on disk, commits deferred due to git corruption from a power cutoff mid-run):

| Task | Status | Scope |
|---|---|---|
| UI-A-03 | ✅ on-disk | Error Boundary around `<Routes>` (App.tsx + ErrorFallback typing fix) |
| SEED-01 | ✅ on-disk | All 4 seed scripts gate on `ENVIRONMENT=development` |
| PERF-DB-02 | ✅ on-disk | marketplace.browse_designs aggregate query (N+1 → 1) |
| PERF-DB-05 | ✅ on-disk | `upload.py:357` wraps `postscript_to_svg` in `asyncio.to_thread` |
| UI-D-01 | ✅ on-disk | Delete orphaned `DashboardPage.tsx` + remove export |
| UI-B-07 | ✅ on-disk | `useDocumentTitle` on Marketplace / Browse / Vendors |
| UI-E-04 | ✅ on-disk | Dynamic `useDocumentTitle` on DesignDetail / VendorProfile |

Operator recovery note: reflog's last healthy HEAD is `d1103f87` ([PERF-DB-04]). Once git is recovered (`git update-ref refs/heads/main d1103f87ea7182ec16818ea6b6d38887a88e6915`), the above on-disk edits can be staged into a single `[batch-recovery]` commit or split by task.

**Batch 6 complete** (all on-disk; commits deferred):

| Task | Status | Scope |
|---|---|---|
| SEC-07 | ✅ on-disk | `/api/payment/test-credentials` requires super-admin role; live-tested 401 |
| SEC-11 | ✅ on-disk | `init_admin_user()` in main.py lifespan + bcrypt verify in admin.py; live-tested 200/401 |
| UI-C-01 | ✅ on-disk | Per-step titles 1-5 in HomePage.tsx |
| UI-D-07 | ✅ on-disk | `useDocumentTitle` on 5 admin pages |
| SEED-06 | ✅ on-disk | `SEED_VENDOR_PASSWORD` env or `secrets.token_urlsafe(16)` |

**Batch 7 complete** (all on-disk; commits deferred):

| Task | Status | Scope |
|---|---|---|
| SEC-04 | ✅ on-disk | 5 mutating routes in designs.py derive user_id from JWT; live-tested 401 |
| SEC-05 | ✅ on-disk | vendor.py uses `decode_access_token`; `/register/{user_id}` deleted; live-tested 401/404 |
| UI-A-07 | ✅ on-disk | Footer `<details>` collapses 6 hjLabs cross-product links |
| UI-D-04 | ✅ on-disk | Admin orders: From/To date inputs + Export CSV (backend export route TODO) |
| UI-D-05 | ✅ on-disk | 4 destructive actions in SuperAdmin now have entity-specific `window.confirm` |

**Batch 10 — platform polish pass** (all done, on-disk):

| Task | Scope |
|---|---|
| POLISH-A (App.css split) | 11,224 → 1,765 lines; 22 feature files under `src/styles/` (admin, marketplace, browse, upload, nav, footer, etc.). Zero visual change intended — verified via byte-identical bundled CSS (184,315 B). |
| POLISH-B (SuperAdminPage split) | 1,562 → 138-line shell + 6 files under `pages/admin/` (Overview, Users, Vendors, Designs, Orders, Stats) + `_shared.ts`. Behavior preserved verbatim. |
| POLISH-C (Admin customer-name display) | `displayCustomer(name, email)` helper: junk names ("he", "fgdfgsdf", "Test User", keyboard-mash <10 chars) render email as primary + name as secondary. |
| POLISH-D (TypeScript `any` cleanup) | 14 `any` usages removed across VendorDashboardPage / MaterialSelector / AdminDashboard / MaterialManager / authStore. `RegisterPayload` type exported; `AxiosError<{detail?:string}>` used for catch narrowing. |
| POLISH-E (Ready-to-Buy card redesign) | JSX restructured to product-card layout (4:3 hero thumbnail, "N materials" badge, title + vendor + material, footer with "From" label + price + "Buy →" CTA that lights up on hover). CSS in `src/styles/marketplace.css`. |
| POLISH-F (Admin independent scrollbars) | `.adm-shell` locked at viewport-minus-navbar height with `overflow:hidden`; `.adm-sidebar-nav` + `.adm-main` each get their own `overflow-y:auto` + thin styled scrollbar. Pattern matches shadcn/ui `sidebar` ref in `AgentiXCyber_internal`. |

Also landed: **ACCESS_TOKEN_EXPIRE_MINUTES 30 min → 30 days (43200)** in `backend/.env` + `config.py` — users stay logged in across sessions without refresh-token complexity.

Also landed: **ACCESS_TOKEN_EXPIRE_MINUTES 30 min → 30 days (43200)** in `backend/.env` + `config.py` — users stay logged in across sessions without refresh-token complexity.

**Batch 8 complete** (all on-disk; commits deferred):

| Task | Status | Scope |
|---|---|---|
| UI-B-01+02 | ✅ on-disk | Ready-to-Buy: dedupe by design_id via useMemo, outer `<Link>` replaces nested-button pattern |
| UI-B-03+04 | ✅ on-disk | Browse: top 6 tags inline + `<details>` overflow; tags moved out of card Link |
| UI-C-08 | ✅ on-disk | Upload stepper: done/active/future branches; completed steps click-to-jump |
| SEED-03 | ✅ on-disk | 2 DesignListing rows per design with deterministic price formula; 8×2=16 rows verified |
| SEC-06 | ✅ on-disk | Vendor review requires auth + completed-order check; aggregate post-flush fix |

### 0.3.2 Open housekeeping for the operator

Several sibling `frontend/src/components/ui/*.tsx` primitive files (Button, Card, Input, Textarea, Select, Badge, EmptyState, PageHeader, Avatar, Stat, Tabs) are **untracked in git** — they were created outside the commit stream we can see. Recommendation: operator reviews `git status -s` and either commits them under a single curation commit or adds them as part of whichever phase first touches them.

Multiple files under `backend/app/` (marketplace.py, seed_marketplace.py, VendorsPage.tsx, VendorProfilePage.tsx, etc.) had the same "untracked when agent started" state — agents' commits correctly introduced them to git as "new files" with minimal diffs, and noted this in their reports.

### 0.4 Agent roster (8 agents, 1 human coordinator)

| ID | Name | Package | Phase |
|----|------|---------|-------|
| SEC  | Security Hardening | §3 | 1 |
| CUR-BE | Currency Backend | §4.1 | 2 |
| CUR-FE | Currency Frontend | §4.2 | 2 (starts after CUR-BE merges the contract) |
| DEMO | Demo-data gating | §4.3 | 2 |
| SEED | Seed-data cleanup | §4.4 | 2 |
| PERF-DB | Backend N+1 + async I/O | §4.5 | 2 |
| UI-A | Shared infra + nav + footer | §5.1 | 3 |
| UI-B | Marketplace pages (Home/Browse/Vendors) | §5.2 | 3 |
| UI-C | Upload flow | §5.3 | 3 |
| UI-D | Admin + Super-admin | §5.4 | 3 |
| UI-E | Design detail + Vendor profile | §5.5 | 3 |
| OBS | Observability + Perf | §6 | 4 |
| QA | Tests + CI | §7 | 4 |

*You may run SEC solo first, then fan out the Phase-2 agents in parallel. Phase-3 agents start once Phase-2 has merged. Phase-4 agents can actually start in parallel with Phase-3 if they avoid the files being changed.*

---

## 1. Shared Contracts (source of truth)

These are defined here so every agent uses the same names/shapes. Lock these before fan-out.

### 1.1 Currency contract

**Supported currencies (initial set):** `USD`, `INR`, `EUR`, `GBP`, `CAD`, `AUD`.
Currency codes are ISO 4217 uppercase 3-letter strings.

**FX strategy:** Platform prices are **stored in USD (base currency)** and **converted at response time**. No per-vendor multi-currency pricing in this phase.

**Backend response envelope (every endpoint that returns prices must include this block):**
```json
{
  "data": { /* ... actual response ... */ },
  "pricing_context": {
    "currency": "INR",
    "base_currency": "USD",
    "fx_rate": 83.12,
    "fx_rate_as_of": "2026-04-17T00:00:00Z"
  }
}
```

- Price fields in `data` are returned **in the requested currency** (already converted). The client does NOT reconvert.
- The client requests a currency via the header `X-Currency: INR` (preferred) or `?currency=INR` (fallback). Default is `USD` if neither present.
- FX rates refresh once per day, cached in Redis/in-memory (key: `fx:rates:{base}`, TTL 24h). Source: `exchangerate.host` (no key needed) or `open.er-api.com`. Fallback: static table in `backend/app/core/fx_fallback.py` (operator to seed manually).

**New model column:**
```python
# backend/app/models/__init__.py
class Material(Base):
    ...
    base_currency = Column(String(3), nullable=False, default="USD")  # NEW
```

Add the same `base_currency` column to `MaterialConfig`, `DesignListing`.

**New endpoint:**
```
GET /api/pricing/context
Response: 200 { "currency": "USD", "base_currency": "USD", "fx_rate": 1.0, "fx_rate_as_of": "..." }
```
This endpoint respects the `X-Currency` header / `?currency=` query and returns the active FX context. The frontend calls this once on app boot and caches in Zustand.

**Frontend formatter (single source of truth):**
```ts
// frontend/src/utils/formatPrice.ts  (NEW FILE — owned by UI-A)
import { useCurrencyStore } from '../store/currencyStore';

export function formatPrice(amount: number, currency?: string): string {
  const code = currency ?? useCurrencyStore.getState().currency;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

The existing `src/store/currencyStore.ts` already has `formatPrice`, but we move it to `utils/formatPrice.ts` to keep the store small and the util tree-shakable. UI-A owns the migration; all other UI agents import from the new path.

**Forbidden in JSX (enforced by ESLint rule added by UI-A):** any of the literal patterns `\$\$\{`, `"\$"`, `'\$'`, or `toFixed(2)` without a surrounding `formatPrice()` call.

### 1.2 `is_internal` / `is_demo` contract

**Purpose:** Hide test/demo rows from public endpoints without deleting them from dev databases.

**New columns (additive migration):**
```python
# Material, Design, Vendor, DesignListing
is_internal = Column(Boolean, nullable=False, default=False, server_default="false")
is_demo     = Column(Boolean, nullable=False, default=False, server_default="false")
```

- `is_internal = True` → never returned by any public endpoint (even admin sees it labeled "Internal").
- `is_demo = True` → only returned when the env flag `SEED_DEMO_DATA` is `true` AND the request has no `?hide_demo=true` filter.
- Public endpoints apply **`is_internal = False` AND (is_demo = False OR settings.SEED_DEMO_DATA)`**.

**Settings:**
```python
# backend/app/core/config.py
SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"
```

### 1.3 Auth contract

All endpoints that mutate user-owned data must use `Depends(get_current_user)` from `backend/app/api/auth.py` and derive `user_id` from the returned `User` object. **Never accept `user_id` as a path, query, or body parameter** except for admin endpoints that explicitly target another user (and those must be behind `Depends(require_platform_admin)`).

Two new dependency functions:
```python
# backend/app/core/security.py
async def require_platform_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "super_admin":
        raise HTTPException(403, "Platform admin only")
    return user

async def require_vendor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("vendor", "super_admin"):
        raise HTTPException(403, "Vendor access required")
    return user
```

The ambiguous `admin.get_current_admin` (at `backend/app/api/admin.py:95`) is **deleted** and replaced with `require_vendor` or `require_platform_admin` at each call site.

### 1.4 Error response contract

All 4xx errors must return:
```json
{ "detail": "Human-readable message", "code": "MACHINE_READABLE_CODE" }
```

No `str(e)` echoing. No leaking Stripe/Razorpay error messages. Server-side `logger.exception(...)` for diagnostics; client gets the generic message.

### 1.5 Page title contract

Every React page mounts `useDocumentTitle("<page title> — LaserHub")` at the top of its component body.

```ts
// frontend/src/hooks/useDocumentTitle.ts  (NEW FILE — owned by UI-A)
import { useEffect } from 'react';
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);
}
```

---

## 2. Project Conventions (must follow)

These are **already in the codebase**. Agents must preserve them.

### 2.1 Backend (Python 3.13, FastAPI)

- **Async everywhere.** No sync DB calls. Use `AsyncSession` from `app/core/database.py`.
- **Commit explicitly in endpoints.** Do not rely on `get_db()` auto-commit (which is being removed — see PERF-DB-03).
- **Pydantic v2 schemas** in `app/schemas/__init__.py`. Request/response split: `FooCreate`, `FooUpdate`, `FooResponse`.
- **Helper functions** named `_foo_to_response(model) -> FooResponse` live next to the route that uses them (see `materials.py:_material_to_response`).
- **Logging via `structlog`** (already configured in `app/core/logger.py`). Use `logger.info(event, key=value)` — do not use `print()` in runtime code.
- **Rate limiter** is `app.state.limiter` (slowapi) — apply via decorators.

### 2.2 Frontend (React 18 + TS + Vite)

- **Functional components only.** No class components.
- **Zustand stores** in `src/store/*.ts`, pattern `create<State>()((set) => ({...}))`.
- **API calls** go through `src/services/api.ts` (configured Axios instance). Wrappers in `src/services/index.ts`.
- **UI primitives** in `src/components/ui/*.tsx` — `Button`, `Card`, `Input`, `Badge`, `EmptyState`, `PageHeader`, `Avatar`, `Stat`, `Skeleton`, `Tabs`, `Select`, `Textarea`.
- **CSS variables** for all colors/spacing (defined in `App.css` `:root`). No new hardcoded hex or px values in component styles.
- **Dark mode** via `.dark-mode` class on `<body>`, toggled by the theme button in `App.tsx`.
- **Sonner toasts**: `import { toast } from 'sonner'; toast.success(msg); toast.error(msg)`.
- **TypeScript**: no `any` unless unavoidable. Use the types exported from `src/services/index.ts`.

### 2.3 File naming

- Page components: `src/pages/FooPage.tsx` (PascalCase + `Page` suffix).
- Feature components: `src/components/Foo.tsx`.
- Hooks: `src/hooks/useFoo.ts`.
- Utils: `src/utils/fooBar.ts` (camelCase file name).
- Stores: `src/store/fooStore.ts`.

### 2.4 Testing

- Backend: `pytest` + `pytest-asyncio`. In-memory SQLite fixture at `tests/conftest.py`. Test files: `backend/tests/test_<feature>.py`.
- Frontend unit: Vitest in `frontend/src/components/__tests__/*.test.tsx`.
- Frontend e2e: Playwright at `frontend/tests/e2e/*.spec.ts` (add if missing).

---

## 3. Phase 1 — Security Hardening (agent: SEC)

**Goal:** Close every critical auth hole and rotate every leaked secret. **Blocks every other phase.**

**Owns:**
- `backend/.env`, `backend/.env.example`, `backend/.gitignore` additions
- `backend/app/core/config.py`
- `backend/app/core/security.py`
- `backend/app/api/auth.py`
- `backend/app/api/designs.py`
- `backend/app/api/vendor.py`
- `backend/app/api/marketplace.py` (auth sections only — lines 405–485 + review/tags endpoints)
- `backend/app/api/payment.py` (`test-credentials` endpoint + error handling)
- `backend/app/api/admin.py` (lines 95, 123, 811, all `get_current_admin` call sites)
- `backend/app/api/tracking.py` (upload photo magic-byte check)

**Do-not-touch:** any frontend file, any seed script, any model definition, any utils/file_parser.py.

---

### SEC-01 — Rotate and gitignore `.env`

**Files:**
- `backend/.env` — sanitize (replace live keys with placeholders)
- `backend/.env.example` — ensure it contains every key used, with `REPLACE_ME` placeholders
- `.gitignore` — confirm `.env` is ignored; if `backend/.env` is tracked, remove from index

**Change:**
1. Operator (human) rotates keys out of band: new Razorpay live keys, new Stripe webhook secret, new Google OAuth client secret, new VAPID keypair, new `SECRET_KEY` (32 bytes of `secrets.token_urlsafe`). Agent cannot do this — agent only prepares the files.
2. Run:
   ```bash
   git rm --cached backend/.env
   echo "backend/.env" >> .gitignore
   echo ".env" >> .gitignore
   ```
3. Ensure `backend/.env.example` exists and contains all keys. Template:
   ```env
   ENVIRONMENT=development
   DATABASE_URL=sqlite+aiosqlite:///./laserhub.db
   SECRET_KEY=REPLACE_ME_32_BYTES
   ADMIN_EMAIL=REPLACE_ME
   ADMIN_PASSWORD=REPLACE_ME
   STRIPE_SECRET_KEY=REPLACE_ME
   STRIPE_PUBLIC_KEY=REPLACE_ME
   STRIPE_WEBHOOK_SECRET=REPLACE_ME
   RAZORPAY_KEY_ID=REPLACE_ME
   RAZORPAY_KEY_SECRET=REPLACE_ME
   RAZORPAY_WEBHOOK_SECRET=REPLACE_ME
   GOOGLE_OAUTH_CLIENT_ID=REPLACE_ME
   GOOGLE_OAUTH_CLIENT_SECRET=REPLACE_ME
   VAPID_PRIVATE_KEY=REPLACE_ME
   VAPID_PUBLIC_KEY=REPLACE_ME
   VAPID_CLAIM_EMAIL=mailto:ops@example.com
   SMTP_SERVER=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASSWORD=
   FRONTEND_URL=http://localhost:5173
   REDIS_URL=
   SUPER_ADMIN_EMAIL=REPLACE_ME
   SEED_DEMO_DATA=false
   ```

**Verify:** `git ls-files backend/.env` returns nothing. `cat backend/.env.example` contains all keys.

**Done when:** repo has no live secret values; `.env.example` complete; `.gitignore` ignores `.env`.

---

### SEC-02 — Refuse-to-boot on default `SECRET_KEY` outside dev  — ✅ DONE (`fc00fd5`)

**File:** `backend/app/core/config.py`

**Change:** At the bottom of the `Settings` class (or in a new `@model_validator(mode="after")`), add:
```python
from pydantic import model_validator

DEFAULT_INSECURE_KEYS = {"change-this-secret-key-in-production", "dev-secret-key"}

@model_validator(mode="after")
def _enforce_production_secrets(self):
    if self.ENVIRONMENT.lower() != "development":
        if self.SECRET_KEY in DEFAULT_INSECURE_KEYS or len(self.SECRET_KEY) < 32:
            raise ValueError(
                f"SECRET_KEY must be set to a non-default 32+ char value when ENVIRONMENT={self.ENVIRONMENT}"
            )
        if not self.ADMIN_PASSWORD or self.ADMIN_PASSWORD == "changeme123":
            raise ValueError("ADMIN_PASSWORD must be rotated in non-dev environments")
    return self
```

**Verify:**
```bash
cd backend && ENVIRONMENT=production SECRET_KEY=change-this-secret-key-in-production python -c "from app.core.config import settings"
# Should raise ValueError
```

**Done when:** starting the app with `ENVIRONMENT=production` and the default key fails fast.

---

### SEC-03 — Introduce `require_platform_admin` and `require_vendor` dependencies

**File:** `backend/app/core/security.py`

**Change:** Add the two functions from §1.3. Import `User` ORM model from `app.models`.

**Then rewrite call sites:**
- In `backend/app/api/admin.py`, every route currently using `Depends(get_current_admin)` must be changed to `Depends(require_vendor)` if the route is vendor-facing, or `Depends(require_platform_admin)` if platform-only.
- Rule: anything under `/api/admin/sa-*` (super-admin tabs) and anything that operates on platform-wide data (all users, all vendors, platform analytics) = `require_platform_admin`. Vendor dashboards, vendor-scoped orders/materials = `require_vendor` with `where vendor_id = current_user.vendor_id` filter.
- Delete the function `get_current_admin` once all call sites are migrated.

**Verify:**
```bash
cd backend && pytest tests/ -k "auth or admin" -x
```

**Done when:** `grep -rn "get_current_admin" backend/app/` returns nothing except the deleted import cleanup; tests pass.

---

### SEC-04 — Fix `designs.py` hardcoded user IDs  — ✅ DONE (on-disk; 5 mutating routes require JWT, derive user_id from `current_user`; ownership checks on share/like/update_tags; file-ownership check uses `getattr(uploaded_by, None)` until `UploadedFile.uploaded_by` column migration lands; live-tested 401s; commit deferred)

**File:** `backend/app/api/designs.py`

**Changes:**
- Line ~41 (`create_design`): replace `creator_id=1` with `creator_id=current_user.id`. Add `current_user: User = Depends(get_current_user)` to the signature.
- Line ~62 (`toggle_design_sharing`): add `Depends(get_current_user)` and check `design.creator_id == current_user.id or current_user.role == "super_admin"`.
- Line ~83 (`like_design`): remove `user_id` from query params. Derive from `Depends(get_current_user)`.
- Line ~118 (`get_my_designs`): remove `user_id` query param. Use `current_user.id`.
- Line ~139 (`update_design_tags`): add `Depends(get_current_user)` + ownership check.
- Line ~37 (`create_design`): check `file.uploaded_by == current_user.id` before linking, else 403.

**Verify:**
```bash
curl -X POST http://localhost:8000/api/designs -d '{...}' # without auth → 401
curl -X POST http://localhost:8000/api/designs/5/like?user_id=99 # param ignored, uses JWT → 200 on self
```

**Done when:** every mutating route requires JWT; no `user_id` in query/body; `pytest tests/test_designs.py -x` passes (add tests if missing — see QA-02).

---

### SEC-05 — Fix `vendor.py` hardcoded user IDs and missing auth  — ✅ DONE (on-disk; `decode_access_token` + JWT-derived user_id; `/register/{user_id}` deleted; live-tested 401/404; commit deferred)

**File:** `backend/app/api/vendor.py`

**Changes:**
- Line ~51 (`get_current_vendor`): use `core.security.decode_access_token` instead of `jwt.decode` directly (the latter skips `iss` validation).
- Line ~88 (`register_vendor`): derive `user_id` from `current_user`, remove any `user_id` param.
- Lines 101–139 (`POST /api/vendors/register/{user_id}`): **delete this entire route**. A user cannot register another user as a vendor.
- Line ~469 (`update_vendor_tags`): add `Depends(get_current_vendor)` + check `vendor.user_id == current_user.id or current_user.role == "super_admin"`.

**Verify:** `grep -n "user_id" backend/app/api/vendor.py` shows no places where user_id is a Query/Path/Body parameter.

**Done when:** all mutating vendor routes require auth; `pytest tests/test_vendor.py -x` passes.

---

### SEC-06 — Fix `marketplace.py` anonymous review + unauthenticated mutations  — ✅ DONE (on-disk; auth required; verified-buyer check via `VendorOrder` join; aggregate recompute fixed with single SQL post-flush; live-tested 401; commit deferred)

**File:** `backend/app/api/marketplace.py`

**Changes:**
- Line ~405 (`create_vendor_review`): require `Depends(get_current_user)`. Check user has at least one `completed` order with this vendor before allowing review.
- Line ~441 (review aggregate recompute): fix double-count bug — compute the new aggregate **after** inserting the review, or use a single query `SELECT AVG(rating), COUNT(*) FROM vendor_reviews WHERE vendor_id=?`.
- Any other mutating routes in this file: require auth.

**Verify:**
```bash
pytest tests/test_marketplace.py::test_review_requires_auth -x
pytest tests/test_marketplace.py::test_review_requires_completed_order -x
```

**Done when:** no anonymous review creation; aggregates correct.

---

### SEC-07 — Gate `/api/payment/test-credentials`  — ✅ DONE (on-disk; requires `get_current_user` + `role=='super_admin'` check; live-tested unauth → 401; commit deferred — git corrupt)

**File:** `backend/app/api/payment.py`

**Change:** At line ~272, add `Depends(require_platform_admin)` to the route signature. Rename route to `/api/payment/admin/test-credentials` to make privilege obvious.

**Verify:** unauthenticated call returns 401; authenticated non-super-admin returns 403.

**Done when:** only super-admin can call.

---

### SEC-08 — Structured error responses (no `str(e)` echoing)

**Files:**
- `backend/app/api/payment.py:72, :128, :186, :245`
- `backend/app/api/auth.py:184`
- `backend/app/core/errors.py` (add new exception classes if needed)

**Change:** Replace `return HTTPException(400, str(e))` with:
```python
logger.exception("payment.create_intent_failed", order_id=order.id)
raise HTTPException(status_code=502, detail="Payment provider error. Please try again.", headers={"X-Error-Code": "PAYMENT_PROVIDER_UNAVAILABLE"})
```

Use the error response shape from §1.4.

**Verify:** simulate Stripe failure → client gets generic message, server logs have the exception.

**Done when:** no `str(e)` survives in any `api/*` file's exception handler.

---

### SEC-09 — Webhook replay protection  — ✅ DONE (on-disk; `WebhookEvent` model + unique `(provider,event_id)` constraint; dedup in Stripe + Razorpay handlers; init_db auto-creates the table; commit deferred)

**File:** `backend/app/api/payment.py` (~line 150)

**Change:** Add a new table `webhook_events(id PK, provider, event_id unique, received_at)` via Alembic migration. On every webhook, insert the event_id; on unique-constraint violation, return `200 {"status": "already_processed"}` early. Do not re-process.

**New migration:** `backend/migrations/versions/<timestamp>_add_webhook_events.py`.

**Verify:** replay same Stripe event twice → second call returns early.

**Done when:** duplicate events no longer re-update orders.

---

### SEC-10 — Magic-byte validation on photo uploads  — ✅ DONE (`3f86898`)

**File:** `backend/app/api/tracking.py:347-376`

**Change:** Before writing the photo, open it with Pillow (`from PIL import Image; Image.open(BytesIO(content)).verify()`) inside a try/except. If it raises or is not in the allowed formats (`JPEG`, `PNG`, `WEBP`), return 400.

**Verify:** upload a `.jpg`-named HTML file → 400.

**Done when:** no non-image can be uploaded with an image extension.

---

### SEC-11 — Hash `ADMIN_PASSWORD` instead of plaintext compare  — ✅ DONE (on-disk; `init_admin_user()` in main.py lifespan + `verify_password` in admin.py; live-tested: correct pw → 200+JWT, wrong pw → 401; commit deferred)

**File:** `backend/app/api/admin.py:123`

**Change:** Replace plaintext compare with a hash compare. At app startup (in `main.py` `init_db()` or a new `init_admin()`), hash `settings.ADMIN_PASSWORD` with `get_password_hash` and store in `User` row where `email=settings.ADMIN_EMAIL`. Login flow uses `verify_password` against the stored hash, not the env var.

**Verify:** `pytest tests/test_admin_login.py -x`.

**Done when:** `grep -n "settings.ADMIN_PASSWORD" backend/app/api/admin.py` finds no plaintext compare.

---

### SEC-12 — Structured 401 handling + audit log  — ✅ DONE (`13b944d`)

**File:** `backend/app/main.py` (global exception handler)

**Change:** Add a global handler that logs every 401 with `request.client.host`, `request.url.path`, `user_agent`. Helps detect credential stuffing.

**Done when:** every 401 produces a `logger.warning("auth.unauthorized", ...)` record.

---

**Phase 1 acceptance:** all SEC-01 … SEC-12 done. `pytest backend/tests/ -x` passes. `bandit -r backend/app/` reports no new HIGH findings. Audit plan §9 CRITICAL and HIGH items marked ✅ in a review comment on the merge PR.

---

## 4. Phase 2 — Data Layer (runs in parallel after SEC merges)

Five agents work in parallel. Each owns a disjoint slice.

### 4.1 Agent CUR-BE — Currency Backend

**Goal:** Implement §1.1 contract on the backend.

**Owns:**
- `backend/app/core/fx.py` (NEW)
- `backend/app/core/fx_fallback.py` (NEW)
- `backend/app/api/pricing.py` (NEW)
- `backend/app/middleware/currency.py` (NEW)
- `backend/app/models/__init__.py` (add `base_currency` column only)
- `backend/app/schemas/__init__.py` (add `PricingContext` + extend existing price-bearing response schemas)
- `backend/app/api/materials.py` (response shape only — keep all other code the same)
- `backend/app/api/marketplace.py` (response shape for design listings / compare vendors only)
- `backend/app/api/orders.py` (response shape only)
- `backend/app/api/calculate.py` (apply FX at response time)
- `backend/app/services/cost_calculator.py` (return USD base + FX applied at boundary)
- New Alembic migration `<timestamp>_add_base_currency.py`

**Do-not-touch:** any frontend file; any endpoint's business logic; any demo data.

#### CUR-BE-01 — Add `base_currency` column

Alembic migration adding `base_currency VARCHAR(3) NOT NULL DEFAULT 'USD'` to `materials`, `material_configs`, `design_listings`. Models get the matching column.

**Verify:** `alembic upgrade head && sqlite3 backend/laserhub.db ".schema materials" | grep base_currency`.

#### CUR-BE-02 — FX service

`backend/app/core/fx.py`:
```python
async def get_rate(from_code: str, to_code: str) -> tuple[float, datetime]:
    """Returns (rate, as_of_utc). Caches 24h. Falls back to static table."""
```

Cache backend: `app.core.cache` (already present). Key: `fx:USD:INR`, TTL 86400.

Fallback table in `fx_fallback.py` — dict of 6 currencies × 6 currencies (or USD pivot).

**Verify:** `pytest tests/test_fx.py -x` (agent writes this test).

#### CUR-BE-03 — Currency middleware

`backend/app/middleware/currency.py` — reads `X-Currency` header or `?currency=` query, validates against `ALLOWED_CURRENCIES = {"USD","INR","EUR","GBP","CAD","AUD"}`, stores on `request.state.currency`. Default `USD`.

Register in `app/main.py` after CORS middleware.

#### CUR-BE-04 — `/api/pricing/context` endpoint

New router `backend/app/api/pricing.py`, registered in `main.py`. Returns the `PricingContext` shape from §1.1.

#### CUR-BE-05 — Convert at response time

In every endpoint that returns prices (material rate, design listing price, order amount, calculate preview, quote compare), wrap prices with:
```python
from app.core.fx import get_rate
from app.schemas import PricingContext

rate, asof = await get_rate("USD", request.state.currency)
response.price = usd_price * rate
response.pricing_context = PricingContext(
    currency=request.state.currency,
    base_currency="USD",
    fx_rate=rate,
    fx_rate_as_of=asof,
)
```

**Scope:** ~8 endpoints. List explicitly in the PR description.

**Verify:** `curl -H 'X-Currency: INR' http://localhost:8000/api/materials` returns rates multiplied by the INR rate and a `pricing_context` block.

#### CUR-BE-06 — Update `MaterialResponse` / `OrderResponse` / `DesignListingResponse` schemas

Add `pricing_context: PricingContext` to each price-bearing response. Nullable during migration, required after frontend catches up.

**Phase 2.1 acceptance:** every price-bearing endpoint returns `pricing_context`; curl with `X-Currency: INR` produces INR numbers; fallback works when the FX provider is unreachable.

---

### 4.2 Agent CUR-FE — Currency Frontend (starts after CUR-BE lands)

**Owns:**
- `frontend/src/utils/formatPrice.ts` (NEW, move from currencyStore)
- `frontend/src/store/currencyStore.ts` (consume `/api/pricing/context`, rename internal `rate` → `fxRate`)
- `frontend/src/services/index.ts` (add `fetchPricingContext()`)
- Every JSX file containing hardcoded `$`:
  - `src/components/MaterialSelector.tsx:199`
  - `src/pages/MaterialComparePage.tsx:92,113`
  - `src/pages/MaterialWizardPage.tsx:209`
  - `src/pages/AdminPage.tsx:328,400`
  - `src/pages/ProfilePage.tsx:299`
  - `src/pages/VendorDashboardPage.tsx:137,242`
  - `src/pages/DashboardPage.tsx:87`  *(but see UI-A — this page is orphaned; skip and let UI-A delete it)*
  - `src/pages/TrackOrderPage.tsx:67`
  - `src/pages/OrderTrackingPage.tsx:119`
  - `src/pages/PublicQuotePage.tsx:102-120`
  - `src/components/OrderForm.tsx:116,332,389,488-490`
  - `src/components/QuoteBuilder.tsx:315,343-347`
  - `src/components/AdminDashboard.tsx` (every stat card)

**Do-not-touch:** anything not in the list above. No page layout changes. No prop renaming. Only replace hardcoded `$` with `formatPrice(x)`.

#### CUR-FE-01 — Create `formatPrice` util and migrate import

1. Create `src/utils/formatPrice.ts` per §1.1.
2. Update `src/store/currencyStore.ts` to remove the old `formatPrice` method; keep the store minimal (`{ currency, setCurrency, fxRate, fxRateAsOf, refresh() }`).
3. On boot (`App.tsx` `useEffect`), call `fetchPricingContext()` and populate store.

#### CUR-FE-02 — Replace every hardcoded `$`

For each file above: change `$${x.toFixed(n)}` → `{formatPrice(x)}`. Import `formatPrice` from the new path. Remove now-unused imports of the old `formatPrice` from the store.

**Verify:**
```bash
cd frontend && npx eslint src/ --rule 'no-restricted-syntax: [error, { selector: "Literal[value=/\\$/]", message: "Use formatPrice" }]'
# or simple grep:
grep -rn '\$\${' frontend/src/ --include='*.tsx' # should be empty
```

#### CUR-FE-03 — ESLint rule to prevent regression

Add `no-restricted-syntax` rule to `frontend/.eslintrc.cjs` forbidding literal `$` followed by `{` in JSX expressions.

**Phase 2.2 acceptance:** all 15 price sites now format via `formatPrice`; currency switcher affects every price on every page.

---

### 4.3 Agent DEMO — Demo-data gating

**Owns:**
- `backend/app/core/config.py` (add `SEED_DEMO_DATA` flag)
- `backend/app/models/__init__.py` (add `is_internal`, `is_demo` columns — coordinate column-add migration timing with CUR-BE)
- `backend/app/api/materials.py`, `marketplace.py`, `vendor.py`, `designs.py` — apply the filter from §1.2 on all public list/browse endpoints
- `backend/app/api/admin.py` — admin can see everything but UI shows an "Internal" / "Demo" badge
- New Alembic migration `<timestamp>_add_is_internal_is_demo.py`
- `frontend/src/components/MaterialManager.tsx:123` — **delete** the client-side `Validation Test` name filter; rely on server-side filter now.

**Do-not-touch:** currency logic (CUR-BE owns), seed scripts (SEED owns), UI layout.

#### DEMO-01 — Migration

Alembic migration adds `is_internal BOOLEAN NOT NULL DEFAULT false` and `is_demo BOOLEAN NOT NULL DEFAULT false` to `materials`, `designs`, `vendors`, `design_listings`.

**Verify:** `alembic upgrade head && sqlite3 backend/laserhub.db ".schema designs" | grep is_demo`.

#### DEMO-02 — Apply filter on public endpoints

In `materials.list_materials`, `designs.browse_designs`, `vendor.list_vendors`, `marketplace.*` list endpoints:
```python
q = q.where(Material.is_internal == False)
if not settings.SEED_DEMO_DATA:
    q = q.where(Material.is_demo == False)
```

#### DEMO-03 — Mark existing demo rows

One-off script `backend/app/scripts/mark_demo_rows.py` that sets `is_demo=True` on all rows inserted by `seed_marketplace.py` / `seed_designs.py`. Identify by author name ("Alex Chen", "Admin User") and vendor name patterns. Run once after migration.

#### DEMO-04 — Mark `Validation Test` material internal

`UPDATE materials SET is_internal = true WHERE name = 'Validation Test';` — execute via a small management command `backend/app/scripts/cleanup_validation_test.py`.

#### DEMO-05 — Remove client-side filter

Delete `MaterialManager.tsx:123` `.filter((m) => m.name !== 'Validation Test')` line.

**Phase 2.3 acceptance:** `/api/materials` no longer returns "Validation Test"; flipping `SEED_DEMO_DATA=true/false` toggles Alex Chen / Admin User designs.

---

### 4.4 Agent SEED — Seed-data cleanup

**Owns:**
- `backend/app/scripts/seed_data.py`
- `backend/app/scripts/seed_marketplace.py`
- `backend/app/scripts/seed_designs.py`
- `backend/app/scripts/mark_demo_rows.py` (NEW, coordinate with DEMO-03)
- `backend/app/models/__init__.py` — fix the duplicate `guest_tracking_token` column declaration (lines 145 and 148)

**Do-not-touch:** auth, currency, API routes.

#### SEED-01 — Gate seed scripts behind ENVIRONMENT  — ✅ DONE (on-disk; all 4 seed scripts guard; commit deferred — git corrupt)

Every `main()` in the seed scripts starts with:
```python
if settings.ENVIRONMENT.lower() != "development":
    raise SystemExit("Seed scripts are development-only. Set ENVIRONMENT=development to run.")
```

#### SEED-02 — Seed demo vendors with realistic historical dates  — ✅ DONE (`b99fa45`)

`seed_marketplace.py`: pass explicit `created_at` to each vendor, spread across the last 24 months (e.g., random offset between 30 and 720 days ago).

#### SEED-03 — Ensure every seeded design has at least one `DesignListing`  — ✅ DONE (on-disk; 2 listings per design, deterministic prices `10.00 + i*2.50`; live DB test: 8×2=16 rows; commit deferred)

`seed_marketplace.py:220-231`: after inserting a design, also insert 2 `DesignListing` rows linking to 2 vendors with realistic prices. Base prices are in USD (per §1.1).

#### SEED-04 — Replace `$file_id=1` placeholder with real SVGs  — ✅ DONE (on-disk; 8 real SVGs in `/static/designs/` → 8 `UploadedFile` rows via idempotent helper → designs linked 1:1; designs 4+5 broken thumbnails fixed; live seed verified; commit deferred)

For designs 4 and 5 (Laser Cut Earrings Set, Mechanical Gear Set) that show missing thumbnails: either link them to existing SVGs in `backend/static/designs/` or remove these designs from the seed.

#### SEED-05 — Strip duplicate model column  — ✅ DONE (`a4de3c7`)

`backend/app/models/__init__.py`: remove the duplicate `guest_tracking_token` declaration (keep one, delete the other, verify `alembic autogenerate` produces no diff).

#### SEED-06 — Upgrade seed passwords to env-driven random  — ✅ DONE (on-disk; `SEED_VENDOR_PASSWORD` env or `secrets.token_urlsafe(16)`; commit deferred — git corrupt)

Replace `"demo123"` x4 in `seed_marketplace.py` with `os.getenv("SEED_VENDOR_PASSWORD", secrets.token_urlsafe(12))`. Log the password once so operator can retrieve it.

**Phase 2.4 acceptance:** re-running the seed produces staggered dates, every design has listings, no `demo123` literal in the codebase.

---

### 4.5 Agent PERF-DB — Backend N+1 + async I/O

**Owns:**
- `backend/app/api/orders.py:315-355` (list_orders)
- `backend/app/api/admin.py:176-178, :192` (list_all_orders, limit caps)
- `backend/app/api/auth.py:295-322` (list_my_orders)
- `backend/app/api/marketplace.py:163, :201-212` (browse_designs)
- `backend/app/api/upload.py:215` (async file write)
- `backend/app/utils/file_converter.py:62,79,109` (subprocess in async)
- `backend/app/core/database.py:58-59` (remove blanket commit)
- `backend/app/api/calculate.py:110` (add `order_by` for determinism)
- `backend/app/middleware/rate_limiter.py:13` (Redis-backed if `REDIS_URL` set)

**Do-not-touch:** route signatures, auth, response shapes.

#### PERF-DB-01 — Eager load orders with selectinload  — ✅ DONE (on-disk; `selectinload(Order.material, Order.uploaded_file)` in orders/admin/auth list endpoints; per-row queries removed; commit deferred)

```python
q = select(Order).options(
    selectinload(Order.material),
    selectinload(Order.uploaded_file),
    selectinload(Order.vendor),
).where(...)
```

Apply to `list_orders`, `list_all_orders`, `list_my_orders`.

#### PERF-DB-02 — Aggregate design listings in one query  — ✅ DONE (on-disk; LEFT JOIN + GROUP BY replaces N+1 per-design loop; commit deferred)

`marketplace.browse_designs`: replace the per-design loop with a single `LEFT JOIN design_listings GROUP BY design_id` query computing `COUNT(*)` and `MIN(price)`.

#### PERF-DB-03 — Remove `get_db` auto-commit

In `core/database.py:58-59`, delete the `await session.commit()` after `yield`. Every endpoint that mutates state must commit explicitly (audit all `api/*` files for missing commits and add where needed — they should already be there but verify).

#### PERF-DB-04 — async file I/O  — ✅ DONE (`d1103f8`)  — ✅ DONE (`d1103f8`)

In `api/upload.py:215`, replace `open(...).write(content)` with `aiofiles.open(...) as f: await f.write(content)`. Add `aiofiles` to `requirements.txt` if missing.

#### PERF-DB-05 — subprocess in threadpool  — ✅ DONE (on-disk; `upload.py:357` now `await asyncio.to_thread(postscript_to_svg, ...)`)

In `utils/file_converter.py:62,79,109`, replace `subprocess.run(...)` with `await asyncio.to_thread(subprocess.run, ...)`.

#### PERF-DB-06 — Cap `limit` params  — ✅ DONE (`159bfc1`)

Any route accepting `limit` as a query param: add `Query(..., le=200, ge=1)`.

#### PERF-DB-07 — Redis rate limiter when available  — ✅ DONE (`67bb594`)

`middleware/rate_limiter.py`:
```python
storage_uri = settings.REDIS_URL or "memory://"
limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)
```

**Phase 2.5 acceptance:** hitting `/api/admin/orders?limit=100` issues at most 4 DB queries (was 200+). Event loop does not stall on large uploads. `pytest backend/tests/ -x` passes.

---

**Phase 2 merge gate:** CUR-BE → CUR-FE → DEMO → SEED → PERF-DB. Merge CUR-BE first (others depend on its migration slot in Alembic).

---

## 5. Phase 3 — UX Polish (5 agents, parallel)

After Phase 2 merges, UI-A through UI-E run in parallel. Each owns a slice of the frontend with zero overlap.

### 5.1 Agent UI-A — Shared Infra + Nav + Footer

**Owns:**
- `frontend/src/App.tsx` (navbar, footer, router config, error boundary)
- `frontend/src/App.css` (only additions; splitting is out of scope here)
- `frontend/src/hooks/useDocumentTitle.ts` (NEW)
- `frontend/src/utils/taxonomy.ts` (NEW — extracted constants)
- `frontend/src/utils/roles.ts` (NEW — centralize super-admin check)
- `frontend/src/components/ui/index.ts` (keep)
- `frontend/src/components/ui/index.tsx` (**delete** — dead code)
- `frontend/src/components/ui/PageHeader.tsx` (switch to react-router `<Link>`)
- `frontend/src/services/api.ts` (401 interceptor → redirect to `/login?next=...`)

**Do-not-touch:** individual page components (other UI agents own those).

#### UI-A-01 — Delete duplicate UI primitives file  — ✅ DONE (working-tree delete; file was never tracked)

`rm src/components/ui/index.tsx`. Run `tsc` to verify no imports broken.

#### UI-A-02 — `useDocumentTitle` hook  — ✅ DONE (`304ee7c`)

Create `src/hooks/useDocumentTitle.ts` per §1.5. Add a call in each page — but since pages are owned by other agents, UI-A only creates the hook. UI-B/C/D/E each add `useDocumentTitle(...)` to their pages.

#### UI-A-03 — React Error Boundary  — ✅ DONE (on-disk; `<ErrorBoundary FallbackComponent={ErrorFallback as unknown as React.ComponentType<FallbackProps>} onReset>` around `<Routes>` in App.tsx; commit deferred — git corrupt)

Wrap `<Routes>` in `App.tsx` with the existing `ErrorFallback.tsx`:
```tsx
import { ErrorBoundary } from 'react-error-boundary'; // add if missing to package.json
...
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <Routes>...</Routes>
</ErrorBoundary>
```

Add `react-error-boundary` to `package.json` dependencies.

#### UI-A-04 — React Router v7 future flags  — ✅ DONE (`8667a01`)

`App.tsx:315`:
```tsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

#### UI-A-05 — Axios 401 redirect  — ✅ DONE (`dc57054`)

`src/services/api.ts` interceptor: on 401 response, `window.location.assign('/login?next=' + encodeURIComponent(window.location.pathname))` unless already on `/login`.

#### UI-A-06 — Remove duplicate "Home" nav link  — ✅ DONE (`8667a01`)

`App.tsx:166` — delete the `<Link to="/">Home</Link>` (logo already links home).

#### UI-A-07 — Footer cleanup  — ✅ DONE (on-disk; `<details>/<summary>` collapses 6 hjLabs links by default; App.tsx + 14 CSS lines; commit deferred)

`App.tsx:295-303`: Move the 6 external hjlabs.in links into a `<details><summary>More Tools</summary>…</details>` block so they're collapsed by default.

#### UI-A-08 — Dynamic copyright year  — ✅ DONE (`8667a01`)

`App.tsx:304`: `© {new Date().getFullYear()} hjLabs.in`.

#### UI-A-09 — Extract taxonomy constants  — ✅ DONE (`15186f2`)

`src/utils/taxonomy.ts` — export `SORT_OPTIONS`, `CATEGORIES`, `CATEGORY_LABELS`. Other UI agents import from here (coordinated import target, no conflicts).

#### UI-A-10 — Extract role helper  — ✅ DONE (`9e5e0e1`)

#### UI-D-03 — Use `isSuperAdmin` helper from UI-A  — ✅ DONE (on-disk; email literal gone from App.tsx + AdminPage.tsx + SuperAdminPage.tsx; `isSuperAdmin(user)` / `isVendor(user)` used; commit deferred)

`src/utils/roles.ts`:
```ts
export const isSuperAdmin = (user: User | null): boolean =>
  !!user && user.role === 'super_admin';
```

Replace 3 hardcoded email checks (`App.tsx:78`, `AdminPage.tsx:61`, `SuperAdminPage.tsx:51`) with this helper. (UI-A edits App.tsx; UI-D edits AdminPage and SuperAdminPage — coordinate the `isSuperAdmin` signature here and leave replacement at call sites to UI-D).

#### UI-A-11 — PageHeader breadcrumbs → react-router Link  — ✅ DONE (`9709c30`)

`src/components/ui/PageHeader.tsx:32` — replace `<a href>` with `import { Link } from 'react-router-dom'` and render `<Link to={crumb.to}>`.

**Phase 3.1 acceptance:** console has zero warnings; clicking a breadcrumb does not full-reload; 401 redirects to `/login?next=...`.

---

### 5.2 Agent UI-B — Marketplace Pages

**Owns:**
- `frontend/src/pages/MarketplacePage.tsx`
- `frontend/src/pages/BrowseDesignsPage.tsx`
- `frontend/src/pages/VendorsPage.tsx`
- `frontend/src/pages/HomePage.tsx` (landing redirects here)

**Do-not-touch:** Design detail (UI-E owns), upload (UI-C), admin, vendor profile (UI-E).

#### UI-B-01 — Homepage: dedupe Ready-to-Buy by design_id  — ✅ DONE (on-disk; groupedListings via useMemo; "N materials" / "From" labels; commit deferred)

`MarketplacePage.tsx:322-367`: group listings by `design_id`, show one card per design, with material/thickness as a "Choose material" dropdown inside the card. The "Buy" button becomes a `<Link to="/design/{design_id}?material={id}&thickness={n}" />`.

#### UI-B-02 — Remove nested buttons on Ready-to-Buy cards  — ✅ DONE (on-disk; outer `<Link>` replaces nested-button anti-pattern; commit deferred)

Convert the outer `<div role="button" onClick>` to a `<Link>`. Remove the inner `<Button>Buy</Button>` (the Link is clickable). Or keep the Buy button and make the card a `<article>` (non-interactive). Pick one; document in the PR.

#### UI-B-03 — Browse: collapse tag bar  — ✅ DONE (on-disk; top 6 inline + `<details>` for remainder; commit deferred)

`BrowseDesignsPage.tsx:245-266`: wrap the tag `<button>` list in `<details><summary>More filters</summary>…</details>`. Show top 6 tags by `description` (design count) expanded by default.

#### UI-B-04 — Browse: move tags out of card Link  — ✅ DONE (on-disk; tags now siblings of `<Link>`, no anchor-in-anchor; commit deferred)

`BrowseDesignsPage.tsx:345,370-380`: move the tag buttons **outside** the outer `<Link>`, or convert them to `<span>` with `onClick={(e) => { e.stopPropagation(); navigate('/browse?tag=' + tag); }}`.

#### UI-B-05 — Browse: consistent card footer  — ✅ DONE (on-disk; always shows ♥ likes / ↓ downloads / price or em-dash; commit deferred)

Every card shows `{formatPrice(minPrice)}` when listings exist, else "Quote on request". After Phase 2 SEED-03 seeds listings for every design, "Quote on request" should be rare.

#### UI-B-06 — Vendors list: placeholder imagery  — ✅ DONE (`fe86f6f`)

`VendorsPage.tsx`: replace initials avatars with a deterministic gradient keyed on `vendor_id`:
```tsx
const gradientFor = (id: number) => {
  const hue = (id * 137) % 360;
  return `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue+60)%360},70%,45%))`;
};
```

#### UI-B-07 — Use `useDocumentTitle`  — ✅ DONE (on-disk; Marketplace / Browse / Vendors all call hook; commit deferred)

Add `useDocumentTitle("Marketplace — LaserHub")`, `useDocumentTitle("Browse Designs — LaserHub")`, `useDocumentTitle("Laser Cutting Vendors — LaserHub")` in the three pages.

#### UI-B-08 — Import taxonomy constants  — ✅ DONE (on-disk; BrowseDesignsPage imports from `utils/taxonomy`; kept local `CATEGORY_ICONS` map since icons are UI concern; commit deferred)

Replace local `SORT_OPTIONS`/`CATEGORIES` definitions (`BrowseDesignsPage.tsx:48-76`, `MarketplacePage.tsx:68-77`) with imports from `src/utils/taxonomy.ts`.

#### UI-B-09 — Remove client-side demo vendor filter

After Phase 2 DEMO lands, `MarketplacePage.tsx:80-86` client-side filter becomes redundant. Delete it.

**Phase 3.2 acceptance:** every marketplace card has a sensible click target, tag buttons work independently of card navigation, page titles update per route.

---

### 5.3 Agent UI-C — Upload Flow

**Owns:**
- `frontend/src/pages/UploadPage.tsx` (if it exists separately) and wherever the 4-step flow is rendered
- `frontend/src/components/FileUpload.tsx`
- `frontend/src/components/MaterialSelector.tsx`
- `frontend/src/components/CostDisplay.tsx`
- `frontend/src/components/OrderForm.tsx`
- `frontend/src/components/KerfPreview.tsx`
- `frontend/src/components/QuoteComparison.tsx`

**Do-not-touch:** admin, marketplace, legal pages.

#### UI-C-01 — `useDocumentTitle` per step  — ✅ DONE (on-disk; 1→5 step-title map in HomePage.tsx; commit deferred — git corrupt)

Title should reflect step: "Upload — LaserHub", "Configure — LaserHub", "Review — LaserHub", "Order — LaserHub".

#### UI-C-02 — MaterialSelector: show "mm" on thickness labels  — ✅ DONE (`8868333`)

`MaterialSelector.tsx:222`: `{thickness} mm` instead of `{thickness}`. Keep the title attribute for accessibility.

#### UI-C-03 — MaterialSelector: quantity input max  — ✅ DONE (`8868333`)

`MaterialSelector.tsx:237-242`: add `max={999}` to the `<input type="number">`. Do not silently cap; show a validation message when user exceeds it.

#### UI-C-04 — MaterialSelector: remove `<div onClick>` anti-pattern  — ✅ DONE (`8868333`)

`MaterialSelector.tsx:177-201`: change outer card from `<div onClick>` to `<button type="button" onClick className="material-card">`. Remove `role` hacks.

#### UI-C-05 — MaterialSelector: use `formatPrice` (coordination with CUR-FE)

This is actually CUR-FE's change. UI-C must not also change it — but if UI-C's branch is created after CUR-FE merges, no conflict.

#### UI-C-06 — Review step: surface top 3 issue categories

`CostDisplay.tsx` currently shows "Score 0/100 · 1458 issues found" but no actionable breakdown. Call a new endpoint `GET /api/upload/{file_id}/issues` that returns `{ categories: [{ label, count, severity }], top_issues: [{...}] }` (endpoint lives under CUR-BE/PERF-DB scope — *no, this is a new endpoint*; hand off to a micro-task for the backend agent).

> **Coordination:** Backend creates `/api/upload/{file_id}/issues` (assign to SEED's next pass if needed, or skip to Phase 4). UI-C adds the UI stub that shows "—" if the endpoint is unavailable.

#### UI-C-07 — OrderForm: `formatPrice` on pay buttons (CUR-FE owns — UI-C verifies)

After CUR-FE merges, confirm pay buttons show the right currency by running the flow. If any remain `$`, file a follow-up.

#### UI-C-08 — Breadcrumbs for upload steps  — ✅ DONE (on-disk; done/active/future branches; completed steps click-to-jump via `jumpTo`; `aria-current="step"` on active; commit deferred)

Stepper at top should be click-to-jump for completed steps. Currently it's not. Track `completedSteps: Set<number>` in local state; render each step as a button if completed, plain text if future.

**Phase 3.3 acceptance:** material selector passes a11y audit; thickness labels show "mm"; step navigation works backwards.

---

### 5.4 Agent UI-D — Admin + Super-admin

**Owns:**
- `frontend/src/pages/AdminPage.tsx`
- `frontend/src/pages/SuperAdminPage.tsx` — **and split it** into `src/pages/admin/Users.tsx`, `Vendors.tsx`, `Designs.tsx`, `Stats.tsx`. Leave `SuperAdminPage.tsx` as a shell that routes between tabs.
- `frontend/src/pages/VendorDashboardPage.tsx`
- `frontend/src/pages/Analytics.tsx`
- `frontend/src/pages/FinancialsDashboard.tsx`
- `frontend/src/pages/Inventory.tsx`
- `frontend/src/pages/DashboardPage.tsx` — **delete** (orphan)
- `frontend/src/components/AdminDashboard.tsx`
- `frontend/src/components/MaterialManager.tsx`
- `frontend/src/components/PaymentSettings.tsx`
- `frontend/src/components/CustomersCRM.tsx`
- `frontend/src/components/QuoteBuilder.tsx`
- `frontend/src/components/TeamPanel.tsx`
- `frontend/src/components/OrderKanban.tsx`

**Do-not-touch:** marketplace, upload, legal.

#### UI-D-01 — Delete orphaned pages  — ✅ DONE (on-disk; `DashboardPage.tsx` deleted + removed from `pages/index.ts`; commit deferred)

`rm src/pages/DashboardPage.tsx`. Also remove exports from `src/pages/index.ts`.

#### UI-D-02 — Split SuperAdminPage.tsx (1553 lines)

Break into 4 feature files: Users, Vendors, Designs, Stats. `SuperAdminPage.tsx` keeps routing logic only (< 100 lines).

#### UI-D-03 — Use `isSuperAdmin` helper from UI-A

Replace `AdminPage.tsx:61` and `SuperAdminPage.tsx:51` email checks with `isSuperAdmin(user)`.

#### UI-D-04 — Orders: date-range filter + CSV export  — ✅ DONE (on-disk; `From`/`To` date inputs + `Export CSV` button in AdminDashboard; refetches on date change; backend `/api/admin/orders/export` TODO-flagged; commit deferred)

Add two controls to the Orders table at `AdminDashboard.tsx`: a date range picker (use native `<input type="date">` x2) and an "Export CSV" button that hits `GET /api/admin/orders/export?from=&to=&status=`.

#### UI-D-05 — Confirm dialog on destructive actions  — ✅ DONE (on-disk; 4 destructive actions in SuperAdminPage now use `window.confirm` with entity-specific messages: delete user / revoke vendor verification / delete design ×2; commit deferred)

`SuperAdminPage.tsx` delete-user and delete-design: use `window.confirm` for now (Phase 3 should not introduce new modal lib). Message: `Delete {entity} "{name}"? This cannot be undone.`

#### UI-D-06 — Hide demo customers from display

After Phase 2 DEMO merges, the API already filters; no frontend change needed. Verify by visiting admin dashboard.

#### UI-D-07 — `useDocumentTitle` on every admin page  — ✅ DONE (on-disk; 5 pages: Admin / VendorDashboard / Analytics / Financials / Inventory; SuperAdmin skipped pending UI-D-02 split; commit deferred)

"Dashboard — LaserHub", "Orders — LaserHub", "Analytics — LaserHub", etc.

#### UI-D-08 — Remove hardcoded `$` in stat cards (CUR-FE coordination)

Already in CUR-FE's scope; UI-D verifies after CUR-FE merges.

**Phase 3.4 acceptance:** SuperAdminPage under 200 lines; destructive actions prompt; dashboards respect currency switcher.

---

### 5.5 Agent UI-E — Design Detail + Vendor Profile

**Owns:**
- `frontend/src/pages/DesignDetailPage.tsx`
- `frontend/src/pages/VendorProfilePage.tsx`

**Do-not-touch:** marketplace, upload, admin.

#### UI-E-01 — Remove duplicate `<h1>` on VendorProfilePage  — ✅ DONE (`a0cfa5f`)

`VendorProfilePage.tsx:161`: delete the inner `<h1>{vendor.shop_name}</h1>`. Keep only the PageHeader at `:148`.

#### UI-E-02 — Enrich SPECS sidebar

After API returns dimensions/area/cut_length (backend change needed — assign to CUR-BE or a follow-up micro-task), surface them. For now, render rows conditionally; show "—" for missing fields.

> **Coordination:** file a backend micro-task for `marketplace.get_design` to include UploadedFile metadata (`dimensions_mm`, `area_cm2`, `cut_length_mm`, `path_count`). Assign to CUR-BE if within Phase 2 budget; else Phase 4 follow-up.

#### UI-E-03 — Related Designs rail

`DesignDetailPage.tsx`: show up to 8 related designs (by shared category or tag). Endpoint: `GET /api/marketplace/designs/{id}/related?limit=8`. Add to backend scope if not already present.

#### UI-E-04 — `useDocumentTitle` per design/vendor  — ✅ DONE (on-disk; dynamic titles using `design?.title` / `vendor?.shop_name`; commit deferred)

`useDocumentTitle(`${design.title} — LaserHub`)`, `useDocumentTitle(`${vendor.shop_name} — LaserHub`)`.

**Phase 3.5 acceptance:** design detail has dimensions, related rail, and no duplicate h1.

---

## 6. Phase 4 — Observability + Perf (agent: OBS)

Runs in parallel with Phase 3 (different files).

**Owns:**
- `backend/app/core/logger.py`
- `backend/app/middleware/logging.py` (NEW)
- `backend/app/main.py` (hook middleware)
- `frontend/src/utils/sentry.ts` (NEW — only if `VITE_SENTRY_DSN` set)
- `frontend/vite.config.ts` (bundle splitting)
- `frontend/src/components/DesignPreview3D.tsx` (only the export wrapping)
- `frontend/src/pages/HomePage.tsx` (lazy-load 3D)
- `.github/workflows/lighthouse.yml` (NEW)

#### OBS-01 — Sentry backend

Add `sentry-sdk[fastapi]` to `requirements.txt`. Init in `main.py` if `SENTRY_DSN` env present. No-op if missing.

#### OBS-02 — Sentry frontend

Add `@sentry/react` dep. Init in `main.tsx` if `VITE_SENTRY_DSN` set.

#### OBS-03 — Structured request log middleware

Every request logs `method`, `path`, `status`, `duration_ms`, `user_id` (if any), `ip` via `structlog`.

#### OBS-04 — Lazy-load 3D preview

```tsx
const DesignPreview3D = lazy(() => import('./components/DesignPreview3D'));
```

Wrap in `<Suspense fallback={<Skeleton />}>`.

#### OBS-05 — Bundle splitting

`vite.config.ts`: manualChunks for `three`, `@react-three/*`, `stripe`, `razorpay`.

#### OBS-06 — Lighthouse CI

`.github/workflows/lighthouse.yml` runs Lighthouse on PRs against a staging URL (or `vite preview`). Thresholds: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms. Fail PR below threshold.

#### OBS-07 — Uptime ping

Add a simple `GET /api/health` (already exists?) or add one returning `{ status: "ok", db: "ok", fx: "ok" }`. Document that operator should plug this into UptimeRobot / BetterStack.

**Phase 4 acceptance:** homepage bundle excludes three.js when 3D not in view; Lighthouse runs in CI.

---

## 7. Phase 5 — Tests + CI (agent: QA)

Runs in parallel with Phases 3 and 4.

**Owns:**
- `backend/tests/test_auth_regression.py` (NEW)
- `backend/tests/test_currency.py` (NEW)
- `backend/tests/test_demo_gating.py` (NEW)
- `backend/tests/test_webhook_replay.py` (NEW)
- `frontend/src/components/__tests__/*.test.tsx` (add formatPrice coverage)
- `frontend/tests/e2e/buyer-upload.spec.ts` (NEW)
- `frontend/tests/e2e/vendor-orders.spec.ts` (NEW)
- `.github/workflows/ci.yml` (NEW or extend)

#### QA-01 — Auth regression tests

For every endpoint SEC touched: test that unauthenticated call → 401; test that user A cannot act on user B's data.

#### QA-02 — Currency conversion test

Hit `/api/materials` with `X-Currency: INR` and assert prices = USD price × FX rate within 0.01 tolerance.

#### QA-03 — Demo gating test

With `SEED_DEMO_DATA=false`, assert no demo vendors/designs in public lists. Flip to `true`, assert they appear.

#### QA-04 — Webhook replay test

POST same Stripe event twice; second call returns `already_processed` without mutating order state.

#### QA-05 — Playwright golden paths

`buyer-upload.spec.ts`: upload a test SVG → configure → review → (mock) order → success page.
`vendor-orders.spec.ts`: login as vendor → see orders → mark one "In Production" → verify event log entry.

#### QA-06 — CI workflow

`.github/workflows/ci.yml`: on PR, run backend pytest + frontend vitest + frontend playwright + eslint + bandit. Block merge on any failure.

**Phase 5 acceptance:** CI green on a sample PR; coverage report shows auth regressions covered.

---

## 8. Coordination Notes (what can collide, how to avoid)

| Potential collision | Resolution |
|---------------------|------------|
| CUR-BE, DEMO both add columns → Alembic migration ordering | CUR-BE merges first; DEMO rebases on top. Coordinate migration slot. |
| UI-A, UI-B, UI-C, UI-D, UI-E all edit `App.css` | **Freeze `App.css` during Phase 3**; agents write scoped styles in their component file's own CSS-in-JS or a new `*.module.css`. |
| UI-A extracts `SORT_OPTIONS`, UI-B imports it | UI-A merges first; UI-B rebases. |
| Backend agents all touch `app/main.py` | CUR-BE adds middleware; OBS adds sentry init. Small, localized edits — resolve conflicts manually. |
| CUR-FE edits files also edited by UI-C/UI-D | CUR-FE is narrow (only `$` → `formatPrice`). UI agents must **not** touch prices; CUR-FE must **not** touch layout. |
| Two agents move code to `src/utils/taxonomy.ts` | UI-A owns creation; others import only. |

**Merge order:** SEC → CUR-BE → DEMO → SEED → PERF-DB → UI-A → UI-B → UI-C → UI-D → UI-E → CUR-FE (can merge earlier if no page-layout conflicts) → OBS → QA.

---

## 9. Forbidden Actions (any agent)

1. **Do not rename any existing file** unless the task explicitly says so.
2. **Do not change the database schema** beyond the migrations listed here.
3. **Do not touch `alembic.ini` or migration templates.**
4. **Do not run `git push --force` or `git rebase -i`.**
5. **Do not install new top-level dependencies** unless listed in your task.
6. **Do not change CI configs** unless you are the QA or OBS agent.
7. **Do not edit `CLAUDE.md`, `ROADMAP.md`, `PLATFORM_AUDIT_2026-04-17.md`, or this file.**
8. **Do not delete tests** that currently pass.
9. **Do not add new `any` / `as any`** in TypeScript.
10. **Do not commit with `--no-verify`.**

---

## 10. Definition of Done (entire plan)

- All 13 agent packages complete.
- `PLATFORM_AUDIT_2026-04-17.md` §9 (security) → every CRITICAL and HIGH resolved.
- `PLATFORM_AUDIT_2026-04-17.md` §10 (data leaks) → every Critical/High resolved.
- `PLATFORM_AUDIT_2026-04-17.md` cross-cutting themes 1–5 → all done.
- CI passes on `main`.
- Manual smoke test: buyer upload → review → mock order; vendor login → kanban; super-admin user role change.
- Lighthouse score ≥ 90 on `/`, `/browse`, `/upload` in production build.

---

## 11. Handoff Checklist (operator → agents)

Before firing agents:
- [ ] Rotate secrets out of band (SEC-01 can only prep files; actual rotation is human).
- [ ] Create 13 git worktrees under `/tmp/laserhub-worktrees/{agent-id}` on branch `agents/{agent-id}`.
- [ ] Each agent is invoked with: a pointer to this file, the agent ID, and the **only** their package section (§3, §4.x, §5.x, §6, or §7).
- [ ] Each agent's prompt must include: "You are agent X. Read only §0, §1, §2, and your package. Follow Owns: and Do-not-touch: strictly."

**Kickoff command (per agent):**
```
You are agent <ID>. Read /home/hemang/Documents/GitHub/LaserHub/IMPLEMENTATION_PLAN_2026-04-17.md sections §0, §1, §2, and your package. Execute every task in your package in order. Run the Verify command after each task. Commit per task ID. Do not modify files outside your Owns list. When complete, summarize what shipped.
```

---

**End of plan. Any deviation is a bug. If in doubt, stop and ask the operator.**
