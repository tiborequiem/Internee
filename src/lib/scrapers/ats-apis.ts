import { checkStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

const WORKABLE_SLUGS = [
  "instabug",
  "paymob",
  "breadfast",
  "robusta",
  "bosta",
  "thndr",
  "swvl",
  "flairstech",
  "valu",
];

const SMARTRECRUITERS_COMPANIES = ["BoschGroup", "Visa", "Orange"];

const REAL_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (
    /software|developer|engineer|swe|devops|data|ai|machine learning|web|backend|frontend|mobile|cloud|cyber|qa|testing/i.test(
      t
    )
  ) {
    if (/mechanical|civil|electrical|automation|hardware/i.test(t)) {
      return "Engineering";
    }
    return "Software & Data";
  }
  if (/finance|accounting|banking|investment|audit|treasury|tax|wealth/i.test(t)) {
    return "Finance";
  }
  if (/marketing|brand|growth|seo|content|social media|pr|creative|commercial/i.test(t)) {
    return "Marketing";
  }
  if (/mechanical|electrical|civil|automation|hardware|embedded|industrial|manufacturing|site/i.test(t)) {
    return "Engineering";
  }
  return "Business";
}

function inferLocation(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("alexandria") || t.includes("alex")) return "Alexandria";
  if (
    t.includes("smart village") ||
    t.includes("giza") ||
    t.includes("october") ||
    t.includes("zayed") ||
    t.includes("dokki")
  ) {
    return "Giza";
  }
  if (t.includes("remote")) return "Remote";
  if (t.includes("hybrid")) return "Hybrid";
  return "Cairo";
}

/**
 * Scrapes all configured Workable public widget accounts
 */
export async function scrapeWorkableAccounts(): Promise<ScrapedInternshipInput[]> {
  const candidates: ScrapedInternshipInput[] = [];

  for (const slug of WORKABLE_SLUGS) {
    try {
      const url = `https://apply.workable.com/api/v1/widget/accounts/${slug}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": REAL_USER_AGENT,
          Accept: "application/json",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const companyName = data.name || slug.charAt(0).toUpperCase() + slug.slice(1);
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];

      for (const job of jobs) {
        const title = (job.title || "").replace(/\s+/g, " ").trim();
        if (!title) continue;

        const loc = `${job.city || ""} ${job.country || "Egypt"}`.trim();
        const filterCheck = checkStrictEgyptInternship(title, loc);

        if (!filterCheck.valid) continue;

        const jobUrl =
          job.url ||
          job.shortlink ||
          (job.shortcode
            ? `https://apply.workable.com/${slug}/j/${job.shortcode}/`
            : `https://apply.workable.com/${slug}/`);

        candidates.push({
          companyName,
          title,
          category: inferCategory(title),
          location: inferLocation(`${title} ${loc}`),
          applicationUrl: jobUrl.split("?")[0].trim(),
          source: "workable",
          sourceType: "portal",
          postedAt: Date.now(),
        });
      }
    } catch {
      // Continue to next slug
    }
  }

  return candidates;
}

/**
 * Scrapes SmartRecruiters public posting endpoints for Egyptian openings
 */
export async function scrapeSmartRecruiters(): Promise<ScrapedInternshipInput[]> {
  const candidates: ScrapedInternshipInput[] = [];

  for (const company of SMARTRECRUITERS_COMPANIES) {
    try {
      const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(
        company
      )}/postings?country=eg`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": REAL_USER_AGENT,
          Accept: "application/json",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const postings = Array.isArray(data.content) ? data.content : [];

      for (const p of postings) {
        const title = (p.name || "").replace(/\s+/g, " ").trim();
        if (!title) continue;

        const city = p.location?.city || "Cairo";
        const loc = `${city}, Egypt`;
        const postedAt = Date.parse(p.releasedDate) || Date.now();

        const filterCheck = checkStrictEgyptInternship(title, loc, postedAt);
        if (!filterCheck.valid) continue;

        const appUrl = `https://jobs.smartrecruiters.com/${company}/${p.id}`;

        candidates.push({
          companyName: p.company?.name || company,
          title,
          category: inferCategory(title),
          location: inferLocation(`${title} ${loc}`),
          applicationUrl: appUrl,
          source: "workable", // categorized under ATS / workable
          sourceType: "portal",
          postedAt,
        });
      }
    } catch {
      // Continue
    }
  }

  return candidates;
}

/**
 * Runs all Workable and SmartRecruiters scrapers and upserts results
 */
export async function runAtsScrapers() {
  console.log("[ATS] Running Workable & SmartRecruiters ATS Public APIs...");

  const workableJobs = await scrapeWorkableAccounts();
  const smartJobs = await scrapeSmartRecruiters();

  const allAtsJobs = [...workableJobs, ...smartJobs];

  // Deduplicate
  const uniqueMap = new Map<string, ScrapedInternshipInput>();
  for (const item of allAtsJobs) {
    if (!uniqueMap.has(item.applicationUrl)) {
      uniqueMap.set(item.applicationUrl, item);
    }
  }

  const uniqueCandidates = Array.from(uniqueMap.values());
  const upsertRes = await upsertScrapedInternships(uniqueCandidates);

  return {
    discovered: uniqueCandidates.length,
    added: upsertRes.added,
    skipped: upsertRes.skipped,
    rejectedByFilter: upsertRes.rejectedByFilter,
  };
}
