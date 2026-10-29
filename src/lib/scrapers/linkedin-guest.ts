import { isStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

const LINKEDIN_KEYWORDS = [
  "Intern",
  "Internship",
  "Trainee",
  "Summer Training",
  "Graduate Intern",
];

const USER_AGENT =
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
  if (t.includes("alexandria")) return "Alexandria";
  if (t.includes("smart village") || t.includes("giza") || t.includes("october") || t.includes("zayed")) {
    return "Giza";
  }
  if (t.includes("remote")) return "Remote";
  if (t.includes("hybrid")) return "Hybrid";
  return "Cairo";
}

/**
 * Scrapes LinkedIn unauthenticated guest search API for a keyword
 */
export async function scrapeLinkedInGuestKeyword(keyword: string): Promise<ScrapedInternshipInput[]> {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
    keyword
  )}&location=Egypt&f_E=1&f_TPR=r2592000&start=0`;

  const results: ScrapedInternshipInput[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`LinkedIn Guest API returned ${res.status} for "${keyword}"`);
      return [];
    }

    const html = await res.text();

    // Match <li> cards
    const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let cardMatch;

    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const cardHtml = cardMatch[1];

      // 1. Link (strip tracking query params after '?')
      const linkMatch = cardHtml.match(/<a[^>]+class="[^"]*base-card__full-link[^"]*"[^>]+href="([^"]+)"/i);
      if (!linkMatch) continue;
      const rawUrl = linkMatch[1];
      const cleanUrl = rawUrl.split("?")[0].trim();

      // 2. Title
      const titleMatch = cardHtml.match(/<h3[^>]+class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
      if (!title) continue;

      // 3. Company
      const companyMatch = cardHtml.match(/<h4[^>]+class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const companyName = companyMatch
        ? companyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "Egyptian Tech Company";

      // 4. Location
      const locationMatch = cardHtml.match(/<span[^>]+class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const rawLocation = locationMatch
        ? locationMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "Cairo, Egypt";

      // 5. Date
      const timeMatch = cardHtml.match(/<time[^>]+datetime="([^"]+)"/i);
      let postedAt = Date.now();
      if (timeMatch) {
        const parsedTime = Date.parse(timeMatch[1]);
        if (!isNaN(parsedTime)) {
          postedAt = parsedTime;
        }
      }

      // Filter with isStrictEgyptInternship (with isExperienceFiltered = true because f_E=1 was enforced by LinkedIn)
      if (!isStrictEgyptInternship(title, rawLocation, postedAt, true)) {
        continue;
      }

      results.push({
        companyName,
        title,
        category: inferCategory(title),
        location: inferLocation(`${title} ${rawLocation}`),
        applicationUrl: cleanUrl,
        source: "linkedin_guest_f_E_1",
        sourceType: "linkedin_post",
        postedAt,
      });
    }
  } catch (err: any) {
    console.warn(`LinkedIn guest scraper error for "${keyword}":`, err.message);
  }

  return results;
}

/**
 * Runs the LinkedIn Guest Jobs scraper across all keywords
 */
export async function runLinkedInGuestScraper() {
  console.log("🔗 Running LinkedIn Undocumented Guest Jobs API Scraper (f_E=1)...");
  const allDiscovered: ScrapedInternshipInput[] = [];

  for (const kw of LINKEDIN_KEYWORDS) {
    const hits = await scrapeLinkedInGuestKeyword(kw);
    allDiscovered.push(...hits);
  }

  // Deduplicate by clean URL before upserting
  const uniqueMap = new Map<string, ScrapedInternshipInput>();
  for (const item of allDiscovered) {
    if (!uniqueMap.has(item.applicationUrl)) {
      uniqueMap.set(item.applicationUrl, item);
    }
  }

  const uniqueCandidates = Array.from(uniqueMap.values());
  const upsertRes = await upsertScrapedInternships(uniqueCandidates);

  return {
    keywordsChecked: LINKEDIN_KEYWORDS.length,
    discovered: uniqueCandidates.length,
    added: upsertRes.added,
    skipped: upsertRes.skipped,
    rejectedByFilter: upsertRes.rejectedByFilter,
  };
}
