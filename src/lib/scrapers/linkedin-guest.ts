import { checkStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

const LINKEDIN_ENDPOINTS = [
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Intern&location=Egypt&f_E=1&start=0",
    isExperienceFiltered: true,
    label: "keywords=Intern&location=Egypt&f_E=1",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Internship&location=Egypt&start=0",
    isExperienceFiltered: false, // Egyptian HRs who omit f_E=1
    label: "keywords=Internship&location=Egypt",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Software%20Intern&location=Egypt&start=0",
    isExperienceFiltered: false,
    label: "keywords=Software Intern&location=Egypt",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Marketing%20Intern&location=Egypt&start=0",
    isExperienceFiltered: false,
    label: "keywords=Marketing Intern&location=Egypt",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Finance%20Intern&location=Egypt&start=0",
    isExperienceFiltered: false,
    label: "keywords=Finance Intern&location=Egypt",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=HR%20Intern&location=Egypt&start=0",
    isExperienceFiltered: false,
    label: "keywords=HR Intern&location=Egypt",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Trainee&location=Egypt&start=0",
    isExperienceFiltered: false,
    label: "keywords=Trainee&location=Egypt",
  },
  {
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Data%20Intern&location=Egypt&start=0",
    isExperienceFiltered: false,
    label: "keywords=Data Intern&location=Egypt",
  },
];

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

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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
 * Scrapes a specific LinkedIn unauthenticated guest search endpoint
 */
export async function scrapeLinkedInGuestEndpoint(endpoint: {
  url: string;
  isExperienceFiltered: boolean;
  label: string;
}): Promise<ScrapedInternshipInput[]> {
  const results: ScrapedInternshipInput[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7500);

    const res = await fetch(endpoint.url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`LinkedIn Guest API returned HTTP ${res.status} for "${endpoint.label}"`);
      return [];
    }

    const html = await res.text();

    // Match <li> cards or <div class="...base-card..."> cards
    const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let cardMatch;

    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const cardHtml = cardMatch[1];

      // 1. Link (href attribute, strip tracking query params after '?')
      const linkMatch =
        cardHtml.match(/<a[^>]+class="[^"]*base-card__full-link[^"]*"[^>]+href="([^"]+)"/i) ||
        cardHtml.match(/<a[^>]+href="([^"]+)"[^>]+class="[^"]*base-card__full-link[^"]*"/i);
      if (!linkMatch) continue;
      const rawUrl = linkMatch[1];
      const cleanUrl = rawUrl.split("?")[0].trim();

      // 2. Title (.base-search-card__title, collapse \s+ and .trim())
      const titleMatch = cardHtml.match(/<h3[^>]+class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const title = titleMatch
        ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        : "";
      if (!title) continue;

      // 3. Company (.base-search-card__subtitle, collapse \s+ and .trim())
      const companyMatch = cardHtml.match(/<h4[^>]+class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const companyName = companyMatch
        ? decodeHtmlEntities(companyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        : "Egyptian Employer";

      // 4. Location (.job-search-card__location, fallback to "Cairo, Egypt")
      const locationMatch = cardHtml.match(/<span[^>]+class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      let rawLocation = locationMatch
        ? locationMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "Cairo, Egypt";
      if (!rawLocation) rawLocation = "Cairo, Egypt";

      // 5. Date
      const timeMatch = cardHtml.match(/<time[^>]+datetime="([^"]+)"/i);
      let postedAt = Date.now();
      if (timeMatch) {
        const parsedTime = Date.parse(timeMatch[1]);
        if (!isNaN(parsedTime)) {
          postedAt = parsedTime;
        }
      }

      // Check strict Egyptian internship validation with diagnostic reasons
      const filterCheck = checkStrictEgyptInternship(
        title,
        rawLocation,
        postedAt,
        endpoint.isExperienceFiltered
      );

      if (!filterCheck.valid) {
        console.log(`[LinkedIn Guest Excluded] "${title}" at "${companyName}": ${filterCheck.reason}`);
        continue;
      }

      results.push({
        companyName,
        title,
        category: inferCategory(title),
        location: inferLocation(`${title} ${rawLocation}`),
        applicationUrl: cleanUrl,
        source: "linkedin",
        sourceType: "linkedin_post",
        postedAt,
      });
    }
  } catch (err: any) {
    console.warn(`LinkedIn guest scraper error on "${endpoint.label}":`, err.message);
  }

  return results;
}

/**
 * Runs the LinkedIn Guest Jobs scraper across all targeted endpoints
 */
export async function runLinkedInGuestScraper() {
  console.log("🔗 Running LinkedIn Guest Jobs Scraper (Dual-Endpoint: f_E=1 + Public HR feed)...");
  const allDiscovered: ScrapedInternshipInput[] = [];

  for (const endpoint of LINKEDIN_ENDPOINTS) {
    const hits = await scrapeLinkedInGuestEndpoint(endpoint);
    allDiscovered.push(...hits);
    await new Promise((r) => setTimeout(r, 350));
  }

  // Deduplicate by clean URL before upserting
  const uniqueMap = new Map<string, ScrapedInternshipInput>();
  for (const item of allDiscovered) {
    if (!uniqueMap.has(item.applicationUrl)) {
      uniqueMap.set(item.applicationUrl, item);
    }
  }

  const uniqueCandidates = Array.from(uniqueMap.values());
  console.log(`LinkedIn Guest scraper spotted ${uniqueCandidates.length} valid unique candidates.`);

  const upsertRes = await upsertScrapedInternships(uniqueCandidates);

  return {
    endpointsChecked: LINKEDIN_ENDPOINTS.length,
    keywordsChecked: LINKEDIN_ENDPOINTS.length,
    discovered: uniqueCandidates.length,
    added: upsertRes.added,
    skipped: upsertRes.skipped,
    rejectedByFilter: upsertRes.rejectedByFilter,
  };
}
