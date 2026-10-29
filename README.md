# Internee | Egypt Internships Directory & Automated Tracker

**Internee** is a minimal, high-density public directory and tracker designed for Egyptian undergraduates and recent graduates. Built with a Catppuccin Mocha aesthetic.

---

## Key Features

1. **Zero Mock Data Guarantee**:
   - Zero hardcoded, fake, or placeholder internships.
   - Database starts clean with verified company portals only; listings appear only when scraped live or submitted by the community and verified.

2. **Strict Dynamic Year & Recency Filter (`isStrictEgyptInternship`)**:
   - **Blocks Past Years:** Automatically extracts any 4-digit year `(20\d{2})` and rejects anything `< currentYear` (e.g. 2024, 2025).
   - **Blocks Expired Seasons:** If current month is $\ge$ September, blocks `Summer ${currentYear}` and `Spring ${currentYear}`.
   - **Blocks Stale Postings:** Postings older than 45 days from `Date.now()` are rejected and automatically hidden from public views.
   - **Blocks Junior/Full-time pollution:** Strictly allows only undergraduate internships, summer training, and graduate academies.

3. **16 Highest-Signal Verified Egyptian Companies**:
   - Vodafone Egypt (_VOIS), Microsoft Egypt ADC, Amazon Egypt, Google Cairo, Instabug / Luciq, Paymob, Breadfast, Valeo Egypt, Siemens EDA Egypt, CIB Egypt, P&G Egypt, Unilever Egypt, PwC Middle East - Egypt, McKinsey Cairo, Elsewedy Electric, Wuzzuf Verified Internships.

4. **Minimal Catppuccin Mocha Desktop UI**:
   - Base canvas `#1e1e2e`, mantle `#181825`, borders `#313244`, text `#cdd6f4`, mauve accent `#cba6f7`.
   - Single-line header with live count and instant navigation tabs.
   - 2-Column workspace with sticky left sidebar (search, open toggle, categories, locations, sectors) and compact interactive table rows.
   - Quiet, editorial empty state.

5. **Local Browser Persistence**:
   - `localStorage` key `egypt_internships_tracker` tracks application status: `Saved` &rarr; `Applied` &rarr; `Interviewing`.

---

## Quick Start

```bash
cd ~/Internee
npm install
npm run db:push
npm run db:seed
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Testing

```bash
npx tsx scripts/test-all.ts
npx tsx scripts/test-api-routes.ts
```
