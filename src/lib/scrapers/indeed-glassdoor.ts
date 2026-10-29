import * as cheerio from "cheerio";
import { checkStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

const INDEED_EGYPT_URL =
  "https://eg.indeed.com/jobs?q=internship&l=Egypt&sc=0kf%3Ajt%28internship%29%3B&fromage=14";

const GLASSDOOR_EGYPT_URL =
  "https://www.glassdoor.com/Job/egypt-internship-jobs-SRCH_IL.0,5_IN69_KO6,16.htm?fromAge=14";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

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
 * Direct fetch attempt for Indeed Egypt with graceful Cloudflare fallback
 */
export async function scrapeIndeedEgypt(): Promise<ScrapedInternshipInput[]> {
  const results: ScrapedInternshipInput[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(INDEED_EGYPT_URL, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.log(`[Indeed Scraper] HTTP ${res.status} (Cloudflare bot check active). Harvester extension and Dork scanner handle ingestion.`);
      return [];
    }

    const html = await res.text();
    if (html.includes("Just a moment...") || html.includes("cf_chl_")) {
      console.log("[Indeed Scraper] Cloudflare challenge encountered on direct IP fetch.");
      return [];
    }

    const $ = cheerio.load(html);
    $(".job_seen_beacon").each((_, beacon) => {
      const el = $(beacon);
      const titleLink = el.find("h2.jobTitle a, a.jcs-JobTitle").first();
      const title = (titleLink.find("span").text() || titleLink.text()).replace(/\s+/g, " ").trim();
      let rawHref = titleLink.attr("href") || "";

      if (!title) return;

      const company = el.find('[data-testid="company-name"]').text().replace(/\s+/g, " ").trim() || "Egyptian Employer";
      const loc = el.find('[data-testid="text-location"]').text().replace(/\s+/g, " ").trim() || "Cairo, Egypt";

      let cleanUrl = rawHref.split("&")[0].split("?")[0];
      if (cleanUrl.startsWith("/")) {
        cleanUrl = `https://eg.indeed.com${cleanUrl}`;
      } else if (!cleanUrl) {
        const dataJk = el.closest("[data-jk]").attr("data-jk") || el.find("[data-jk]").attr("data-jk");
        if (dataJk) cleanUrl = `https://eg.indeed.com/viewjob?jk=${dataJk}`;
      }

      if (!cleanUrl) return;

      const filterCheck = checkStrictEgyptInternship(title, loc);
      if (filterCheck.valid) {
        results.push({
          companyName: company,
          title,
          category: inferCategory(title),
          location: inferLocation(`${title} ${loc}`),
          applicationUrl: cleanUrl,
          source: "indeed",
          sourceType: "portal",
          postedAt: Date.now(),
        });
      }
    });
  } catch (err: any) {
    console.log("[Indeed Scraper] Direct fetch error:", err.message);
  }

  return results;
}

/**
 * Direct fetch attempt for Glassdoor Egypt with graceful Cloudflare fallback
 */
export async function scrapeGlassdoorEgypt(): Promise<ScrapedInternshipInput[]> {
  const results: ScrapedInternshipInput[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GLASSDOOR_EGYPT_URL, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.log(`[Glassdoor Scraper] HTTP ${res.status} (Cloudflare bot check active). Harvester extension and Dork scanner handle ingestion.`);
      return [];
    }

    const html = await res.text();
    if (html.includes("Just a moment...") || html.includes("cf_chl_")) {
      console.log("[Glassdoor Scraper] Cloudflare challenge encountered on direct IP fetch.");
      return [];
    }

    const $ = cheerio.load(html);
    $('li[data-test="jobListing"], div[data-test="jobListing"]').each((_, card) => {
      const el = $(card);
      const titleLink = el.find('a[data-test="job-link"]').first();
      const title = (el.find('[data-test="job-title"]').text() || titleLink.text()).replace(/\s+/g, " ").trim();
      let rawHref = titleLink.attr("href") || "";

      if (!title || !rawHref) return;

      const company = (
        el.find('[data-test="employer-name"]').text() ||
        el.find(".EmployerProfile_compactEmployerName__").text()
      ).replace(/\s+/g, " ").trim() || "Egyptian Employer";

      const loc = el.find('[data-test="emp-location"]').text().replace(/\s+/g, " ").trim() || "Cairo, Egypt";

      let cleanUrl = rawHref.split("?")[0].trim();
      if (cleanUrl.startsWith("/")) {
        cleanUrl = `https://www.glassdoor.com${cleanUrl}`;
      }

      const filterCheck = checkStrictEgyptInternship(title, loc);
      if (filterCheck.valid) {
        results.push({
          companyName: company,
          title,
          category: inferCategory(title),
          location: inferLocation(`${title} ${loc}`),
          applicationUrl: cleanUrl,
          source: "glassdoor",
          sourceType: "portal",
          postedAt: Date.now(),
        });
      }
    });
  } catch (err: any) {
    console.log("[Glassdoor Scraper] Direct fetch error:", err.message);
  }

  return results;
}

/**
 * Runs Indeed & Glassdoor server-side scrapers and upserts results
 */
export async function runIndeedGlassdoorScraper() {
  console.log("💼 Running Indeed Egypt & Glassdoor Scrapers (Direct fetch + Graceful Cloudflare fallback)...");

  const indeedJobs = await scrapeIndeedEgypt();
  const glassdoorJobs = await scrapeGlassdoorEgypt();

  const allJobs = [...indeedJobs, ...glassdoorJobs];

  const uniqueMap = new Map<string, ScrapedInternshipInput>();
  for (const item of allJobs) {
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
