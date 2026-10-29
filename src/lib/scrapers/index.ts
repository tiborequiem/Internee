import { db } from "@/db";
import { companies } from "@/db/schema";
import { ne } from "drizzle-orm";
import { isStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";
import { runDorkScanner } from "./dork-scanner";
import { runLinkedInGuestScraper } from "./linkedin-guest";

// Regex required by spec
const TITLE_REGEX = /intern|trainee|graduate|academy|vodanation|rowad|student/i;
const LOCATION_REGEX = /egypt|cairo|giza|alexandria|smart village|october|remote|hybrid/i;

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

function inferLocation(title: string, rawLocation: string): string {
  const combined = `${title} ${rawLocation}`.toLowerCase();
  if (combined.includes("alexandria")) return "Alexandria";
  if (combined.includes("smart village") || combined.includes("giza") || combined.includes("october")) {
    return "Giza";
  }
  if (combined.includes("remote")) return "Remote";
  if (combined.includes("hybrid")) return "Hybrid";
  return "Cairo";
}

/**
 * Scrapes or extracts internship candidate roles for a given company
 */
async function scrapeCompany(company: typeof companies.$inferSelect): Promise<ScrapedInternshipInput[]> {
  const results: ScrapedInternshipInput[] = [];

  // Special Case 1: Workable Public Widget JSON API
  if (company.scraperType === "workable") {
    try {
      const workableSlug = company.slug.replace("-egypt", "");
      const workableApiUrl = `https://apply.workable.com/api/v1/widget/accounts/${workableSlug}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(workableApiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": REAL_USER_AGENT,
          Accept: "application/json",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const jobs = Array.isArray(json.jobs) ? json.jobs : [];
        for (const job of jobs) {
          const title = job.title || "";
          const loc = `${job.city || ""} ${job.country || "Egypt"}`;
          const url =
            job.url ||
            job.shortlink ||
            (job.shortcode
              ? `https://apply.workable.com/${workableSlug}/j/${job.shortcode}/`
              : company.careersUrl);

          if (TITLE_REGEX.test(title) && LOCATION_REGEX.test(loc)) {
            results.push({
              companyId: company.id,
              companySlug: company.slug,
              title,
              category: inferCategory(title),
              location: inferLocation(title, loc),
              applicationUrl: url,
              sourceType: "portal",
              postedAt: Date.now(),
            });
          }
        }
        return results;
      }
    } catch {
      // Gracefully continue to standard scraper
    }
  }

  // Special Case 2: Wuzzuf Verified Internships Feed
  if (company.slug === "wuzzuf-internships") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(company.careersUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": REAL_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        const jobRegex = /<a[^>]+href="(https:\/\/wuzzuf\.net\/jobs\/p\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = jobRegex.exec(html)) !== null && results.length < 15) {
          const url = match[1];
          const title = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

          if (title.length > 5 && TITLE_REGEX.test(title)) {
            results.push({
              companyId: company.id,
              companySlug: company.slug,
              title,
              category: inferCategory(title),
              location: inferLocation(title, "Cairo, Egypt"),
              applicationUrl: url,
              sourceType: "portal",
              postedAt: Date.now(),
            });
          }
        }
        return results;
      }
    } catch {
      // Fallback
    }
  }

  // General Company Career Page Scraper
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(company.careersUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": REAL_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/json,*/*",
      },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        const jobs = Array.isArray(json) ? json : json.jobs || json.postings || [];
        for (const job of jobs) {
          const title = job.title || job.text || "";
          const loc = job.location?.name || job.categories?.location || "Cairo, Egypt";
          const url = job.absolute_url || job.hostedUrl || job.applyUrl || company.careersUrl;

          if (TITLE_REGEX.test(title) && LOCATION_REGEX.test(loc)) {
            results.push({
              companyId: company.id,
              companySlug: company.slug,
              title,
              category: inferCategory(title),
              location: inferLocation(title, loc),
              applicationUrl: url,
              sourceType: "portal",
              postedAt: Date.now(),
            });
          }
        }
      } else {
        const html = await res.text();
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          const href = match[1];
          const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

          if (text.length > 5 && text.length < 100 && TITLE_REGEX.test(text)) {
            let fullUrl = href;
            if (href.startsWith("/")) {
              try {
                const u = new URL(company.careersUrl);
                fullUrl = `${u.origin}${href}`;
              } catch (e) {
                fullUrl = href;
              }
            }

            results.push({
              companyId: company.id,
              companySlug: company.slug,
              title: text,
              category: inferCategory(text),
              location: inferLocation(text, "Cairo, Egypt"),
              applicationUrl: fullUrl,
              sourceType: "portal",
              postedAt: Date.now(),
            });
          }
        }
      }
    }
  } catch {
    // Return empty on failure - ZERO mock fallbacks
  }

  return results;
}

/**
 * Runs both the company scrapers and the social/form Google-dork scanner
 */
export async function runScrapers() {
  console.log("🚀 Starting scraper engine (Portals + Social/Dork Discovery)...");

  const automatedCompanies = await db
    .select()
    .from(companies)
    .where(ne(companies.scraperType, "manual"));

  console.log(`Found ${automatedCompanies.length} companies to scan.`);

  const allScrapedCandidates: ScrapedInternshipInput[] = [];
  const reportDetails: Array<{
    company: string;
    foundCount: number;
    scraperType: string;
  }> = [];

  for (const company of automatedCompanies) {
    const candidates = await scrapeCompany(company);

    const validCandidates = candidates.filter(
      (c) =>
        TITLE_REGEX.test(c.title) &&
        LOCATION_REGEX.test(c.location) &&
        isStrictEgyptInternship(c.title, c.location, c.postedAt)
    );

    allScrapedCandidates.push(...validCandidates);

    reportDetails.push({
      company: company.name,
      foundCount: validCandidates.length,
      scraperType: company.scraperType,
    });
  }

  // 1. Upsert all portal discovered internships
  const portalResult = await upsertScrapedInternships(allScrapedCandidates);

  // 2. Execute Social & Google Dork scanner alongside
  let dorkResult = {
    scannedQueries: 0,
    rawHitsFound: 0,
    validCandidates: 0,
    added: 0,
    skipped: 0,
    rejectedByFilter: 0,
  };

  try {
    dorkResult = await runDorkScanner();
  } catch (err) {
    console.warn("Dork scanner error:", err);
  }

  // 3. Execute LinkedIn Undocumented Guest Jobs Scraper (f_E=1)
  let linkedInResult = {
    endpointsChecked: 0,
    keywordsChecked: 0,
    discovered: 0,
    added: 0,
    skipped: 0,
    rejectedByFilter: 0,
  };

  try {
    linkedInResult = await runLinkedInGuestScraper();
  } catch (err) {
    console.warn("LinkedIn guest scraper error:", err);
  }

  const totalAdded = portalResult.added + dorkResult.added + linkedInResult.added;
  const totalDiscovered =
    allScrapedCandidates.length + dorkResult.validCandidates + linkedInResult.discovered;

  return {
    success: true,
    scannedCompanies: automatedCompanies.length,
    portalDiscovered: allScrapedCandidates.length,
    portalAdded: portalResult.added,
    dorkScannedQueries: dorkResult.scannedQueries,
    dorkHitsFound: dorkResult.rawHitsFound,
    dorkAdded: dorkResult.added,
    linkedInDiscovered: linkedInResult.discovered,
    linkedInAdded: linkedInResult.added,
    totalDiscovered,
    newRolesAdded: totalAdded,
    existingSkipped: portalResult.skipped + dorkResult.skipped + linkedInResult.skipped,
    rejectedByFilter:
      portalResult.rejectedByFilter + dorkResult.rejectedByFilter + linkedInResult.rejectedByFilter,
    details: reportDetails,
    timestamp: new Date().toISOString(),
  };
}
