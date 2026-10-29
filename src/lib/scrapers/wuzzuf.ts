import * as cheerio from "cheerio";
import { checkStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

const WUZZUF_HTML_URL =
  "https://wuzzuf.net/search/jobs/?filters%5Bcountry%5D%5B0%5D=Egypt&filters%5Bpost_type%5D%5B0%5D=Internship";

const WUZZUF_API_URL =
  "https://wuzzuf.net/api/job?filters[country][0]=Egypt&filters[post_type][0]=Internship&sort=-postedAt&pageSize=25";

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
 * Scrapes Wuzzuf Egypt Internship listings via HTML with JSON fallback
 */
export async function scrapeWuzzufFeed(): Promise<ScrapedInternshipInput[]> {
  const candidates: ScrapedInternshipInput[] = [];

  // Attempt 1: Fetch HTML and parse with cheerio
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(WUZZUF_HTML_URL, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();

      // Check if Cloudflare challenged
      if (!html.includes("Just a moment...") && !html.includes("cf_chl_")) {
        const $ = cheerio.load(html);

        // Find job cards
        $('div[data-testid="job-card"], .css-1gatmva, .css-pkv5jc, div.job-card').each(
          (_, card) => {
            const cardEl = $(card);
            const titleEl = cardEl.find('h2 a, a[href*="/jobs/p/"]').first();
            const title = titleEl.text().replace(/\s+/g, " ").trim();
            let rawHref = titleEl.attr("href") || "";

            if (!title || !rawHref) return;

            let cleanUrl = rawHref.split("?")[0].trim();
            if (cleanUrl.startsWith("/")) {
              cleanUrl = `https://wuzzuf.net${cleanUrl}`;
            }

            const companyEl = cardEl.find('a.css-17s97q8, a[href*="/jobs/careers/"]').first();
            let companyName = companyEl.text().replace(/\s+/g, " ").trim();
            if (!companyName) {
              companyName = "Egyptian Employer";
            }

            const locationEl = cardEl.find(".css-5wys0k, span.job-location").first();
            let rawLocation = locationEl.text().replace(/\s+/g, " ").trim();
            if (!rawLocation) rawLocation = "Cairo, Egypt";

            const filterCheck = checkStrictEgyptInternship(title, rawLocation, Date.now());
            if (filterCheck.valid) {
              candidates.push({
                companyName,
                title,
                category: inferCategory(title),
                location: inferLocation(`${title} ${rawLocation}`),
                applicationUrl: cleanUrl,
                source: "wuzzuf",
                sourceType: "portal",
                postedAt: Date.now(),
              });
            }
          }
        );

        if (candidates.length > 0) {
          console.log(`[Wuzzuf Scraper] Extracted ${candidates.length} valid roles via HTML.`);
          return candidates;
        }
      } else {
        console.log("[Wuzzuf Scraper] Direct HTML challenged by Cloudflare. Switching to API endpoint...");
      }
    }
  } catch (err: any) {
    console.warn("[Wuzzuf Scraper] HTML fetch failed, falling back to JSON API:", err.message);
  }

  // Attempt 2: Fetch Wuzzuf Public API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(WUZZUF_API_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const jobs = Array.isArray(json.data) ? json.data : [];

      for (const item of jobs) {
        const attr = item.attributes;
        if (!attr) continue;

        const title = (attr.title || "").replace(/\s+/g, " ").trim();
        if (!title) continue;

        let postedAt = Date.now();
        if (attr.postedAt) {
          const parsed = Date.parse(attr.postedAt);
          if (!isNaN(parsed)) postedAt = parsed;
        }

        const city = attr.location?.city?.name || "";
        const area = attr.location?.area?.name || "";
        const country = attr.location?.country?.name || "Egypt";
        const rawLocation = `${area} ${city} ${country}`.trim() || "Cairo, Egypt";

        // Filter role with strict rules
        const filterCheck = checkStrictEgyptInternship(title, rawLocation, postedAt);
        if (!filterCheck.valid) continue;

        const slug = attr.slug || attr.uri || "";
        const cleanUrl = `https://wuzzuf.net/jobs/p/${slug}`;

        // Infer company name from slug if available
        let companyName = "Egyptian Employer";
        if (slug) {
          const parts = slug.split("-");
          if (parts.length >= 4) {
            // Slug structure often: [id]-[title-words]-[company-words]-[city]-Egypt
            const middle = parts.slice(2, parts.length - 2).join(" ");
            if (middle.length > 2) {
              companyName = middle;
            }
          }
        }

        candidates.push({
          companyName,
          title,
          category: inferCategory(title),
          location: inferLocation(`${title} ${rawLocation}`),
          applicationUrl: cleanUrl,
          source: "wuzzuf",
          sourceType: "portal",
          postedAt,
        });
      }
    }
  } catch (err: any) {
    console.warn("[Wuzzuf Scraper] API endpoint error:", err.message);
  }

  return candidates;
}

/**
 * Runs the Wuzzuf scraper and upserts discovered roles
 */
export async function runWuzzufScraper() {
  console.log("🌐 Running Wuzzuf Egypt Internship Scraper...");
  const candidates = await scrapeWuzzufFeed();

  // Deduplicate by clean application URL
  const uniqueMap = new Map<string, ScrapedInternshipInput>();
  for (const item of candidates) {
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
