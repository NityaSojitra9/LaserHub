# LaserHub — Supermarket Roadmap

> **Vision**: Become the "Amazon of CO2 laser cutting" — a one-stop platform where a buyer *always* finds what they need, a vendor runs *their entire business*, and every interaction feels fast, snappy, and reliable.

---

## Guiding Principles

1. **Supermarket psychology** — breadth of selection + predictable reliability = recurring demand.
2. **Both sides win** — vendors get operating leverage (run the shop), buyers get confidence (find + trust).
3. **Speed is a feature** — every page < 1 s, every interaction < 200 ms, instant quotes.
4. **Zero-doubt trust** — verification, reviews, guarantees, clear dispute paths.
5. **Progressive depth** — simple for a first-time buyer, powerful for a repeat pro.

---

## Phase 0 — Stabilize & Polish (1–2 weeks)

**Goal**: The MVP must feel rock-solid before adding surface area. Fix audit bugs, trim friction.

- [ ] Fix remaining audit bugs:
  - Avatar dropdown labels (use "Vendor Dashboard", "Super Admin → Users" etc.)
  - Analytics donut chart missing legend
  - Material action icons too small
  - Zustand persist desync on `localStorage.clear()`
  - PWA manifest icon 404 (`/pwa-192x192.png`)
- [ ] Loading skeletons on every async list (no blank flashes)
- [ ] Consistent error toasts + retry buttons
- [ ] Mobile responsiveness audit — every page usable on 360 px wide
- [ ] Keyboard navigation (tab order, Enter-to-submit, Esc-to-close)
- [ ] Accessibility pass: aria labels, focus rings, color contrast
- [ ] Production CSP via reverse proxy (not meta tag)
- [ ] Sentry or similar error tracking
- [ ] Uptime monitoring (ping + Slack alert)

---

## Phase 1 — Vendor Essentials (COMPLETED ✅ — MVP)

**Goal**: A laser-cutting shop owner can run their entire operation from LaserHub.

### 1.1 Order & Production Management
- [ ] Kanban-style order board (New → Accepted → In Production → Shipped → Delivered)
- [ ] Priority/deadline flagging with visual urgency
- [ ] Job status updates with customer-visible timeline + photos
- [ ] Batch action (accept/decline/assign multiple orders)
- [ ] Print-friendly work order sheet (PDF, QR, part list)

### 1.2 Quote Builder
- [ ] Custom quote creator for off-platform inquiries
- [ ] Bulk pricing tiers (e.g. 1–10 qty X, 11–50 qty Y)
- [ ] Material markup rules (% or flat)
- [ ] Setup fee configuration
- [ ] Quote expiry + auto-follow-up email

### 1.3 Material Inventory
- [ ] Sheet stock in + out tracking
- [ ] Remnant library (label + reuse offcuts)
- [ ] Reorder alerts at low threshold
- [ ] Cost basis (FIFO or avg)
- [ ] Supplier links + reorder history

### 1.4 Financials
- [ ] Revenue dashboard (daily/weekly/monthly, by material/category/customer)
- [ ] Profit margin per order (revenue − material − labor − energy)
- [ ] Tax report exports (GST/VAT/sales tax)
- [ ] Cash-flow projection (paid invoices - upcoming expenses)
- [ ] Payout history with Stripe/Razorpay settlement data

### 1.5 Customer CRM
- [ ] Client directory with order/spend history
- [ ] Repeat-customer badges + auto-discount rules
- [ ] Notes per customer
- [ ] Bulk email (announcements, promos) — with unsubscribe
- [ ] Win-back campaigns for lapsed customers

### 1.6 Team Accounts
- [ ] Multi-user per shop (owner / operator / designer / accountant)
- [ ] Role-based permissions
- [ ] Activity log (who did what when)

---

## Phase 2 — Buyer Essentials (COMPLETED ✅ — MVP)

**Goal**: A first-time buyer can go from idea → delivered product in under 5 minutes of active work.

### 2.1 Frictionless Ordering
- [ ] One-click reorder from order history
- [ ] Guest checkout (email only, convert to account post-order)
- [ ] Multi-address shipping in one order
- [ ] Saved payment methods + default address
- [ ] Gift wrapping + message option

### 2.2 Smart Quote Comparison
- [ ] Side-by-side vendor comparison (price/turnaround/rating/location)
- [ ] Filter quotes by deadline, budget, materials available
- [ ] Save quote for later, re-compare after 7/14 days
- [ ] Request negotiation / counter-offer

### 2.3 Order Tracking & Transparency
- [ ] Real-time status with vendor photo updates
- [ ] Courier tracking integration (Delhivery, BlueDart, UPS, FedEx)
- [ ] SMS + WhatsApp + email + push notifications
- [ ] Estimated delivery with confidence band
- [ ] Delay alerts + rescheduling

### 2.4 Buyer Design Tools
- [ ] Instant file validator (is this laser-cuttable? closed paths? RGB vs stroke?)
- [ ] Dimension confirmation (show "this will cut 100 × 200 mm — correct?")
- [ ] Material preview (3D of design in chosen material + thickness)
- [ ] Kerf preview (hide/show laser beam offset)
- [ ] Add-text-to-engrave overlay
- [ ] Color-coded cut/engrave/score layers

### 2.5 Material Selection Help
- [ ] "Help me pick a material" wizard (5 questions → 3 suggestions)
- [ ] Material comparison table (acrylic / MDF / plywood / leather / cardstock)
- [ ] Sample pack ordering (physical swatches)
- [ ] Material safety & use-case callouts (food-safe, outdoor, flame-retardant)

---

## Phase 3 — Selection Depth: Design Library (2–3 weeks)

**Goal**: Buyers always find *something* — even if they didn't upload anything.

### 3.1 Expanded Free Library
- [ ] Import top 500 CC0 designs from SVGRepo / OpenClipart / Thingiverse
- [ ] Categorize into 20+ micro-categories (not 8 broad ones)
- [ ] Curated collections (Wedding, Christmas, STEM, Name Signs, Enclosures)
- [ ] Trending / New / Staff Picks rails
- [ ] "Designs under ₹500" / "Same-day delivery" filters

### 3.2 Template Generators
- [ ] Box generator (finger-joint, living-hinge, slide-top)
- [ ] Keychain generator (text + shape)
- [ ] Name sign generator (font library + border styles)
- [ ] Puzzle generator (image → jigsaw cut)
- [ ] Gear generator (teeth count, bore, module)
- [ ] Enclosure generator (electronics, dimensions + port cutouts)

### 3.3 Paid Design Marketplace
- [ ] Designers can sell SVG/DXF templates with revenue share (70 / 30)
- [ ] Royalty-free licensing clarity
- [ ] Designer storefront + follower system
- [ ] DMCA takedown flow

### 3.4 AI Design Assist
- [ ] Text-to-design ("decorative wall clock, boho, 300 mm")
- [ ] Sketch-to-vector (webcam/camera upload → clean SVG)
- [ ] Image-to-stencil (upload photo → cut path)
- [ ] "Make it laser-cuttable" auto-fix (close paths, remove fills, convert strokes)

---

## Phase 4 — Trust & Quality (2 weeks)

**Goal**: A buyer spending ₹50,000 on a custom order feels as safe as buying on Amazon.

### 4.1 Verification
- [ ] 3-tier vendor verification badges (ID / Business / LaserHub Verified)
- [ ] Business docs upload (GST, shop license) — super-admin review
- [ ] Portfolio proof (photos of past work + machine)
- [ ] Live video call verification (optional premium tier)

### 4.2 Review System v2
- [ ] Verified-purchase reviews only
- [ ] Photo/video in reviews
- [ ] Rating sub-scores (quality, communication, shipping, price)
- [ ] Vendor reply to reviews
- [ ] Helpful-vote sorting
- [ ] Flag + moderation flow

### 4.3 Guarantees
- [ ] 7-day quality guarantee (refund/rework if defects)
- [ ] Lowest-price match across vendors
- [ ] On-time delivery guarantee (₹X credit if late)
- [ ] Platform-backed escrow for orders > threshold

### 4.4 Dispute Resolution
- [ ] Structured dispute portal (buyer opens → vendor responds → platform mediates)
- [ ] Required evidence: photos, measurements
- [ ] Standardized resolution templates
- [ ] Public dispute outcome stats per vendor

---

## Phase 5 — Production Efficiency Tools (4–6 weeks)

**Goal**: Vendors save 20 %+ material and time by using platform tools vs. manual workflows.

### 5.1 Nesting Optimizer
- [ ] Auto-nest multiple orders on a single sheet
- [ ] User-uploaded sheet sizes + remnant library integration
- [ ] Material yield % preview
- [ ] Download G-code / DXF of nested layout

### 5.2 Kerf & Path Tools
- [ ] Kerf compensation (offset inside/outside per material)
- [ ] Multi-pass thick material support
- [ ] Auto-detect cut vs engrave vs score from layer colors
- [ ] Path-order optimization (minimize head travel)

### 5.3 Machine Integration
- [ ] LightBurn / RDWorks export presets
- [ ] USB direct send (plug-in for Windows/Linux)
- [ ] Job queue on the machine (vendor marks "loaded" from mobile)
- [ ] Camera integration (photo capture of finished cut for QC)

### 5.4 Production Scheduling
- [ ] Capacity calendar (orders vs machine hours)
- [ ] Auto-estimate delivery based on current backlog
- [ ] Job batching suggestions (similar material → same session)
- [ ] Operator shift scheduling

### 5.5 Consumables Tracker
- [ ] Laser tube hours + replacement alerts
- [ ] Lens / mirror cleaning schedule
- [ ] Assist gas (air / oxygen) usage tracking
- [ ] Auto-reorder consumables when low

---

## Phase 6 — Discovery & Search (2–3 weeks)

**Goal**: Find anything in 3 seconds. Users shouldn't need to know exact terms.

### 6.1 Search Upgrade
- [ ] Elasticsearch / Meilisearch backend
- [ ] Typo-tolerant matching
- [ ] Faceted filters (price slider, material multi-select, location, turnaround)
- [ ] Search autocomplete with categories
- [ ] Saved searches + email alerts

### 6.2 Visual Search
- [ ] Upload image → find similar designs
- [ ] CLIP embeddings on design thumbnails
- [ ] "More like this" on every design card

### 6.3 Recommendation Engine
- [ ] "You might also like" (collaborative filtering)
- [ ] Homepage personalization by browsing history
- [ ] Email digest of new designs in your favorite categories
- [ ] Vendor match score on upload ("best vendor for your file")

### 6.4 Location & Local
- [ ] Near-me filter (vendor within X km)
- [ ] Local pickup option (save shipping)
- [ ] Pincode-based ETA
- [ ] Map view of vendors

---

## Phase 7 — Community & Growth (2–3 weeks)

**Goal**: LaserHub feels like a living community, not a dead listings site.

### 7.1 Social Features
- [ ] Follow vendors / designers → feed of new drops
- [ ] Like / comment / share on designs
- [ ] User portfolio pages ("I made these on LaserHub")
- [ ] Inspiration feed on homepage

### 7.2 Education
- [ ] Getting-started guide (upload first file in 2 minutes)
- [ ] Material-selection course
- [ ] Design tutorials (Inkscape / Illustrator / LightBurn)
- [ ] Case studies / customer stories
- [ ] FAQ chatbot

### 7.3 Growth Mechanics
- [ ] Referral program (₹X credit for you + friend)
- [ ] Loyalty tier (Bronze → Silver → Gold → Platinum)
- [ ] Monthly design challenges with prizes
- [ ] Seasonal promotions (Diwali, Christmas, Valentine's)
- [ ] Influencer / maker ambassador program

### 7.4 Content Marketing
- [ ] Blog (Ghost or similar)
- [ ] SEO-optimized category landing pages
- [ ] Schema markup for rich results
- [ ] Weekly newsletter

---

## Phase 8 — Scale & Integrations (ongoing)

**Goal**: LaserHub is the rails other businesses build on.

### 8.1 Public API
- [ ] REST + GraphQL API
- [ ] API key management per customer
- [ ] Webhooks (order status, payout, review)
- [ ] Rate limits + quotas
- [ ] Developer docs + sandbox

### 8.2 Integrations
- [ ] Shopify plugin (sell laser-cut products, fulfill via LaserHub)
- [ ] Etsy order sync (auto-import orders for vendors)
- [ ] Zapier / Make / n8n triggers
- [ ] Google Drive / Dropbox file import
- [ ] Slack / Discord notifications

### 8.3 Mobile Apps
- [ ] React Native or Flutter apps (iOS + Android)
- [ ] Camera-based file upload
- [ ] Push notifications (order status)
- [ ] AR preview (see design in your room)
- [ ] Barcode scan (vendor workflow)

### 8.4 B2B / Enterprise
- [ ] Company accounts (multiple users, cost centers, POs)
- [ ] Volume pricing tiers
- [ ] Dedicated account manager
- [ ] Custom SLA
- [ ] White-label portal for big customers

### 8.5 International
- [ ] Multi-language UI (Hindi, Marathi, Tamil → later EN / DE / ES)
- [ ] Region-specific vendor pools
- [ ] Local payment methods (UPI, SEPA, ACH)
- [ ] Customs documentation auto-generation
- [ ] Multi-currency payouts

---

## Phase 9 — AI & Automation (ongoing)

**Goal**: The platform gets smarter with every order.

### 9.1 Pricing Intelligence
- [ ] Dynamic pricing suggestions for vendors based on market
- [ ] Buyer "price too high?" alert with cheaper alternatives
- [ ] Bulk-discount predictor
- [ ] Seasonal demand forecasting

### 9.2 Automated Moderation
- [ ] NSFW / copyright detection on uploads
- [ ] Auto-reject weapon / illegal content
- [ ] Spam review detection
- [ ] Fake vendor detection

### 9.3 Delivery Prediction
- [ ] ML model predicting actual delivery date
- [ ] Risk flag for late orders before they happen
- [ ] Vendor reliability score (self-improving)

### 9.4 Design Intelligence
- [ ] Auto-tag uploaded designs
- [ ] Auto-categorize
- [ ] Similar-design detection (copyright / plagiarism)
- [ ] Material recommender for uploaded designs

### 9.5 Customer Support
- [ ] AI chatbot for FAQs (Claude/GPT wrapper)
- [ ] Auto-draft responses for vendors
- [ ] Sentiment analysis on reviews → vendor alerts
- [ ] Proactive issue detection (long silence → auto-ping vendor)

---

## Phase 10 — Trust Infrastructure (ongoing)

**Goal**: LaserHub is the most trusted name in laser cutting.

- [ ] SOC 2 Type II compliance
- [ ] GDPR full compliance
- [ ] PCI-DSS for payment flows
- [ ] Bug bounty program (HackerOne)
- [ ] Annual security audit
- [ ] Transparency report (uptime, disputes, takedowns)
- [ ] Insurance partnerships (shipping insurance add-on)

---

## Cross-Cutting Engineering Work

Applies to every phase — not standalone but compounding.

### Performance
- [ ] Server-side rendering on marketplace pages
- [ ] Image CDN (Cloudflare Images / bunny.net) with WebP/AVIF
- [ ] Code-split per route
- [ ] Database query caching (Redis)
- [ ] PWA offline for browsing cached designs
- [ ] Lighthouse score > 95 on all public pages

### Observability
- [ ] Structured logging everywhere
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Metrics dashboard (Grafana)
- [ ] Alerting (PagerDuty / Slack)
- [ ] User session replay (LogRocket or similar — with privacy masks)

### Testing
- [ ] Unit tests → 70 % coverage
- [ ] E2E tests (Playwright) on critical flows
- [ ] Load testing (k6) before launch
- [ ] Visual regression tests
- [ ] Accessibility tests (axe)

### DX / Velocity
- [ ] Storybook for components
- [ ] CI/CD pipeline (GitHub Actions → Cloudflare / Vercel)
- [ ] Preview deployments per PR
- [ ] Feature flags (Unleash / GrowthBook)
- [ ] Staging environment with seeded data

---

## Prioritization Framework (for picking next ticket)

Score each item on:
1. **Buyer impact** (does it increase conversion / retention?)
2. **Vendor impact** (does it reduce their workload / increase margin?)
3. **Effort** (small / medium / large)
4. **Blocks future phases?** (foundational = higher priority)

Formula: `(BuyerImpact + VendorImpact) / Effort`. Highest first.

---

## "Supermarket" Success Metrics

Track these weekly:

- **Selection**: # public designs, # active vendors, # materials × thicknesses
- **Speed**: p50 / p95 page load, p50 / p95 quote latency, search response time
- **Reliability**: uptime %, order fulfillment rate, on-time delivery %
- **Trust**: avg rating, dispute rate, refund rate
- **Stickiness**: DAU/MAU, repeat-buy rate, vendor retention
- **Growth**: new signups, first order conversion, referral rate

---

## Quick-Win Backlog (do these in spare time between phases)

- Keyboard shortcuts (`/` to search, `u` to upload, `.` for command palette)
- Dark mode polish (already started)
- Email template redesign (transactional)
- Onboarding tour for new users (React Joyride)
- Changelog page (what's new)
- Status page (public uptime)
- Better 404 / error pages
- Favicon + OG image refresh

---

## Phase Ownership Suggestion

| Phase | Focus | Est. Time | Parallelizable? |
|-------|-------|-----------|-----------------|
| 0 | Stabilize | 1–2 w | Low |
| 1 | Vendor core | 3–4 w | Medium (split CRM / financials / production) |
| 2 | Buyer core | 3–4 w | Medium (split ordering / design tools) |
| 3 | Selection depth | 2–3 w | High (library seeding + generators) |
| 4 | Trust | 2 w | Medium |
| 5 | Production efficiency | 4–6 w | Medium (most technical) |
| 6 | Discovery | 2–3 w | Low (all touches search infra) |
| 7 | Community | 2–3 w | High (many independent features) |
| 8 | Scale | ongoing | High |
| 9 | AI | ongoing | Medium |
| 10 | Trust infra | ongoing | Low |

Recommended execution order: **0 → 1 + 2 in parallel → 3 + 4 in parallel → 5 → 6 → 7 → 8/9/10 ongoing.**

---

**Next Step**: Pick Phase 0 and start burning down bugs. When Phase 0 completion rate ≥ 80 %, kick off Phase 1 + 2 simultaneously.
