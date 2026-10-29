# Internee | Egypt Internships Discovery Engine & Directory

Internee is an automated discovery engine, quality gate, and high-density desktop directory built specifically for Egyptian university students and recent graduates. It eliminates stale postings, ghost jobs, and miscategorized junior roles through multi-source scraping, dynamic date filtering, and an optional community feed extension.

---

```
                                  INTERNEE INGESTION PIPELINE
                                  
  [LinkedIn Guest API]      [Wuzzuf XML Stream]      [ATS Public APIs]      [Scout Extension / Links]
  Dual-endpoint search      Daily sitemap feed       Workable & SmartRec    Passive feed harvester
  8 keyword clusters        Bypasses Cloudflare      Top Egyptian tech      Google Forms & LinkedIn
           │                         │                       │                         │
           └─────────────────────────┼───────────────────────┴─────────────────────────┘
                                     ▼
                      [Strict Date & Seniority Filter]
                      • Rejects past years (< currentYear)
                      • Drops expired Summer/Spring seasons
                      • Enforces 45-day freshness limit
                      • Strips true seniority (Junior/Senior/Lead)
                      • Retains valid intern titles (Specialist/PM)
                                     ▼
                      [Persistent SQLite / Drizzle ORM]
                      • Zero fake or placeholder listings
                      • Upsert deduplication by clean URL
                      • Self-healing on empty database
                                     ▼
                      [Anti-Slop Catppuccin Mocha UI]
                      • Density-optimized desktop workspace
                      • Keyboard navigation (/, j, k, Enter)
                      • Client-side application status tracking
```

---

## Core Strengths & Architectural Highlights

### 1. Dual-Endpoint LinkedIn Guest Scraper
Traditional scrapers fail on LinkedIn because authentication walls and dynamic anti-bot mechanisms trigger on standard search pages. Internee hits LinkedIn's undocumented unauthenticated Guest API:
- Dual-endpoint discovery querying both `f_E=1` (LinkedIn's native internship experience tag) and open public HR keyword feeds across 8 Egyptian keyword segments (`Intern`, `Internship`, `Software Intern`, `Marketing Intern`, `Finance Intern`, `HR Intern`, `Trainee`, `Data Intern`).
- Polite request pacing (350ms throttle between keyword clusters) to maintain continuous unblocked ingestion.
- Normalizes raw application URLs and strips tracking parameters (`?refId=...`, `?trackingId=...`) for clean deduplication.

### 2. Cloudflare-Resilient Wuzzuf Sitemap Ingestion
Wuzzuf serves active Egyptian internships but protects its search HTML with Cloudflare bot challenges (HTTP 403) and API content-type restrictions (HTTP 406).
- Internee circumvents HTML scraper blocking by consuming Wuzzuf's daily sitemap feeds (`sitemap-job-1.xml`).
- Direct XML ingestion extracts genuine, timestamped job URLs without headless browser overhead or proxy networks.
- Applies strict title and location filters to harvest only genuine internships located in Cairo, Giza, Alexandria, and Egyptian tech hubs.

### 3. Strict Date, Season & Seniority Quality Gate (`isStrictEgyptInternship`)
Most job boards in Egypt are polluted with outdated roles from previous intake cycles or junior full-time positions mislabeled as internships. Internee's filter enforces deterministic rules:
- **Dynamic Year Verification:** Extracts 4-digit years `(20\d{2})`. Any role referencing a year prior to the runtime calendar year is blocked immediately.
- **Season Expiry Detection:** If the system calendar is past August (month >= September), roles tagged with `Summer ${currentYear}` or `Spring ${currentYear}` are discarded as expired.
- **45-Day Freshness Window:** Any posting older than 45 days is automatically rejected, preventing ghost job accumulation.
- **Seniority Isolation vs. Role Context:** Roles containing true seniority prefixes (`Junior`, `Senior`, `Lead`, `Principal`, `Director`, `Head of`) are rejected. Crucially, roles containing `"Specialist"`, `"Manager"`, or `"Full-time"` are permitted if the title explicitly contains `"Intern"` or `"Trainee"` (e.g. *Talent Acquisition Specialist Intern*, *Product Manager Intern*).

### 4. Direct ATS Public API Ingestion
Internee integrates directly with public recruitment APIs used by high-signal Egyptian startups and scaleups:
- **Workable Widget API:** Queries structured accounts for Egyptian tech employers (Instabug, Paymob, Breadfast, Robusta, Bosta, Thndr, Swvl, etc.).
- **SmartRecruiters Public API:** Direct endpoint querying for multinationals operating development centers in Egypt.
- Zero web scraping overhead: fetches clean JSON payloads with accurate city, title, and application URLs.

### 5. Self-Reporting Browser Extension (Internee Scout)
Many Egyptian startups, student clubs, and tech teams hire via LinkedIn feed posts, X shouts, or Google Forms that never reach traditional job boards.
- **Cross-Browser WebExtension:** Compatible with Zen Browser, Firefox, Google Chrome, Brave, Arc, and Microsoft Edge (located in `/extension`).
- **Passive Feed Harvester:** Runs a debounced `MutationObserver` (~1.2s debounce) that scans visible feed text for internship keywords and Egyptian location signals as students scroll.
- **1-Click Local Drop:** Automatically submits candidate URLs to the tracker backend via `/api/community/quick-drop`.
- **Local Deduplication:** Caches seen URLs in `chrome.storage.local` to prevent duplicate submissions.

### 6. Anti-Slop, High-Density Desktop UI
The web application is designed with an editorial, CLI-grade aesthetic inspired by Linear and GitHub:
- **Catppuccin Mocha Palette:** Base canvas `#1e1e2e`, mantle `#181825`, borders `#313244`, text `#cdd6f4`, mauve accent `#cba6f7`.
- **Zero Emojis & Zero Marketing Fluff:** No patronizing explainers, no decorative pulsing dots, no nested card clutter.
- **Keyboard Navigation:** Press `/` to focus the search filter, `j` and `k` to navigate row selections, and `Enter` to open the active role in a new browser tab.
- **Client-Side Application Tracking:** Local browser persistence tracks each role across stages: `Saved` &rarr; `Applied` &rarr; `Interviewing`.

---

## 16 Monitored Egyptian Employers

Internee monitors root career portals and intake cycles for top employers in Egypt:

| Employer | Sector | Scraper / Ingestion | Intake Window |
| :--- | :--- | :--- | :--- |
| Vodafone Egypt (_VOIS) | Telecom | Career Portal / LinkedIn Guest | Apr to Jun (Vodanation) |
| Microsoft Egypt ADC | Tech | Career Portal / LinkedIn Guest | Oct to Feb / Aug to Oct |
| Amazon Egypt | Tech | Career Portal / LinkedIn Guest | Oct to Mar (Summer Intake) |
| Google Cairo | Tech | Career Portal / LinkedIn Guest | Oct to Jan (STEP & SWE) |
| Instabug / Luciq | Tech | Workable JSON API | Apr to Jun |
| Paymob | Fintech | Workable JSON API | May to Jul |
| Breadfast | Tech | Workable JSON API | Apr to Jul |
| Valeo Egypt | Engineering | Workday / LinkedIn Guest | Apr to Jun (Valeo Academy) |
| Siemens EDA Egypt | Engineering | Career Portal / LinkedIn Guest | Mar to Jun |
| CIB Egypt | Banking | Career Portal (SAS Program) | Apr to Jun |
| P&G Egypt | FMCG | Workday / LinkedIn Guest | Sep to Nov / Feb to Apr |
| Unilever Egypt | FMCG | Workday (ULIP) | Mar to May |
| PwC Middle East Egypt | Consulting | Workday (ETIC Tech) | Feb to May / Sep to Nov |
| McKinsey Cairo | Consulting | Career Portal | Sep to Nov / Jan to Mar |
| Elsewedy Electric | Engineering | Career Portal (SIP) | May to Jul |
| Wuzzuf Verified Internships | Tech / All | Daily XML Sitemap Stream | Year round |

---

## Technical Stack

- **Framework:** Next.js 14 (App Router, Server Components)
- **Database:** SQLite via `@libsql/client` and Turso (zero external server dependencies for local dev)
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS with Catppuccin Mocha theme
- **Icons:** Lucide React (`strokeWidth={1.75}`)
- **Testing:** Standalone test harness (`tsx scripts/test-all.ts`) with 27 deterministic specification tests
- **Extension:** WebExtension Manifest V3 (Gecko & Chromium)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/tiborequiem/Internee.git
cd Internee

# Install dependencies
npm install

# Push database schema
npm run db:push

# Seed verified employers and trigger live ingestion
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the live directory.

---

## Automated Ingestion & Scraper Execution

To manually trigger the ingestion pipeline across all sources:

```bash
# Run all scrapers (LinkedIn, Wuzzuf, ATS, Dork Scanner)
npx tsx -e 'import { runScrapers } from "./src/lib/scrapers"; runScrapers().then(console.log);'
```

Or trigger via authenticated API endpoints:
- **Cron Endpoint:** `GET /api/cron/scrape?token=CRON_SECRET`
- **Admin Moderation:** `POST /api/admin/trigger-scrape` (with `x-admin-secret` header)

---

## Test Suite

The repository includes a comprehensive test suite covering the filter algorithms, database integrity, and API route handlers:

```bash
# Run system specification tests (Date filter, seniority filter, queries)
npx tsx scripts/test-all.ts

# Run API route handler tests
npx tsx scripts/test-api-routes.ts

# Run production build validation
npm run build
```

---

## Extension Installation (Internee Scout)

### Zen Browser & Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `extension/manifest.json`.

### Chrome, Brave, Arc & Edge
1. Navigate to `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked**.
3. Select the `extension/` directory.
