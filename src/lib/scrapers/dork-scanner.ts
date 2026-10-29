import { isStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

export interface SearchHit {
  title: string;
  link: string;
  snippet?: string;
  date?: string;
}

const DORK_QUERIES = [
  'site:linkedin.com/posts ("intern" OR "internship" OR "تدريب صيفي" OR "متدرب") ("Cairo" OR "Egypt" OR "Giza")',
  'site:linkedin.com/jobs/view ("Intern" OR "Internship") ("Cairo" OR "Egypt")',
  'site:docs.google.com/forms ("Internship" OR "Summer Training" OR "Intern" OR "تدريب") ("Egypt" OR "Cairo" OR "GUC" OR "AUC" OR "Ain Shams" OR "Cairo University")',
  'site:instagram.com/p/ ("internship" OR "hiring interns") ("Egypt" OR "Cairo")',
  'site:tiktok.com ("internship" OR "تدريب") ("Egypt" OR "Cairo")',
  'site:eg.indeed.com ("Intern" OR "Internship" OR "Summer 2027" OR "Winter Internship") ("Cairo" OR "Giza" OR "Egypt")',
  'site:glassdoor.com/job-listing ("Intern" OR "Internship") ("Cairo" OR "Egypt")',
];

export function detectSourceType(url: string): "portal" | "linkedin_post" | "google_form" | "tiktok" | "instagram" {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com/posts") || u.includes("linkedin.com/feed") || u.includes("linkedin.com/jobs/view")) {
    return "linkedin_post";
  }
  if (u.includes("docs.google.com/forms") || u.includes("forms.gle")) {
    return "google_form";
  }
  if (u.includes("tiktok.com")) {
    return "tiktok";
  }
  if (u.includes("instagram.com")) {
    return "instagram";
  }
  return "portal";
}

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/software|developer|frontend|backend|swe|full-stack|fullstack|data|ai|machine learning|cloud|cyber|mobile|ios|android/i.test(t)) {
    if (/mechanical|civil|electrical|hardware|automotive|embedded/i.test(t)) {
      return "Engineering";
    }
    return "Software & Data";
  }
  if (/finance|accounting|banking|fintech|audit|tax|investment/i.test(t)) {
    return "Finance";
  }
  if (/marketing|growth|content|social media|brand|creative|seo|pr/i.test(t)) {
    return "Marketing";
  }
  if (/mechanical|electrical|civil|automation|hardware|embedded|industrial|construction|telecom/i.test(t)) {
    return "Engineering";
  }
  return "Business";
}

function inferLocation(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("alexandria")) return "Alexandria";
  if (t.includes("smart village") || t.includes("giza") || t.includes("october") || t.includes("zayed")) return "Giza";
  if (t.includes("remote")) return "Remote";
  if (t.includes("hybrid")) return "Hybrid";
  return "Cairo";
}

/**
 * Smart snippet & title parser
 */
export function parseSearchResultToInternship(hit: SearchHit): ScrapedInternshipInput | null {
  const rawTitle = hit.title || "";
  const rawSnippet = hit.snippet || "";
  const link = hit.link || "";

  if (!link || !rawTitle) return null;

  // Clean title: remove platform trailing suffixes
  let cleanTitle = rawTitle
    .replace(/\|\s*LinkedIn.*$/i, "")
    .replace(/-\s*Google Forms.*$/i, "")
    .replace(/\|\s*Instagram.*$/i, "")
    .replace(/\|\s*TikTok.*$/i, "")
    .replace(/on LinkedIn.*$/i, "")
    .replace(/on Instagram.*$/i, "")
    .trim();

  // Infer company name
  let companyName = "Egyptian Tech Community";
  
  // Pattern 1: "Company - Title" or "Company | Title" or "Company: Title"
  const separatorMatch = cleanTitle.match(/^([A-Za-z0-9&.\s_()]+?)\s*[:|—–-]\s*(.+)$/);
  if (separatorMatch) {
    const candidateCompany = separatorMatch[1].trim();
    const candidateTitle = separatorMatch[2].trim();
    if (candidateCompany.length < 35 && !/^(intern|internship|hiring|summer)/i.test(candidateCompany)) {
      companyName = candidateCompany;
      cleanTitle = candidateTitle;
    }
  } else {
    // Pattern 2: "X is hiring a Y Intern"
    const hiringMatch = (cleanTitle + " " + rawSnippet).match(/([A-Z][A-Za-z0-9&.\s]+?)\s+is hiring\s+(?:an?\s+)?(.+?intern\w*)/i);
    if (hiringMatch) {
      companyName = hiringMatch[1].trim();
      cleanTitle = hiringMatch[2].trim();
    }
  }

  // Ensure title contains intern keyword
  if (!/intern|trainee|graduate|academy|student|تدريب/i.test(cleanTitle)) {
    // Check snippet for title
    const snippetMatch = rawSnippet.match(/([A-Za-z\s]+(internship|intern|summer training|trainee))/i);
    if (snippetMatch) {
      cleanTitle = snippetMatch[1].trim();
    } else {
      cleanTitle = `${cleanTitle} Intern`;
    }
  }

  const location = inferLocation(`${cleanTitle} ${rawSnippet}`);
  const category = inferCategory(`${cleanTitle} ${rawSnippet}`);
  const sourceType = detectSourceType(link);

  // Validate with strict filter
  const now = Date.now();
  if (!isStrictEgyptInternship(cleanTitle, location, now)) {
    return null;
  }

  let source = "dork";
  const lowerLink = link.toLowerCase();
  if (lowerLink.includes("indeed.com")) source = "indeed";
  else if (lowerLink.includes("glassdoor.com")) source = "glassdoor";
  else if (lowerLink.includes("wuzzuf.net")) source = "wuzzuf";
  else if (lowerLink.includes("linkedin.com")) source = "linkedin";

  return {
    companyName,
    title: cleanTitle,
    category,
    location,
    applicationUrl: link,
    source,
    sourceType,
    postedAt: now,
  };
}

/**
 * Query Serper API
 */
async function querySerper(query: string, apiKey: string): Promise<SearchHit[]> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "eg",
        hl: "en",
        tbs: "qdr:w", // past week
      }),
    });

    if (!res.ok) {
      console.warn(`Serper API error: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const organic = data.organic || [];
    return organic.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      date: item.date,
    }));
  } catch (err) {
    console.warn("Serper request failed:", err);
    return [];
  }
}

/**
 * Fallback Public DuckDuckGo HTML / Lite Query
 */
async function queryDuckDuckGoFallback(query: string): Promise<SearchHit[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);
    if (!res.ok) return [];

    const html = await res.text();
    const hits: SearchHit[] = [];

    // Extract links: <a class="result__url" href="..."> or <a class="result__snippet" ...>
    const regex = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null && hits.length < 10) {
      const rawLink = match[1];
      const snippet = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      // Decode DDG redirected URL (e.g. //duckduckgo.com/l/?uddg=https%3A%2F%2F...)
      let actualUrl = rawLink;
      if (rawLink.includes("uddg=")) {
        const u = new URL(rawLink, "https://html.duckduckgo.com");
        const uddg = u.searchParams.get("uddg");
        if (uddg) actualUrl = decodeURIComponent(uddg);
      }

      hits.push({
        title: snippet.slice(0, 70),
        link: actualUrl,
        snippet,
      });
    }

    return hits;
  } catch {
    return [];
  }
}

/**
 * Execute Dork Scanner across all target queries
 */
export async function runDorkScanner() {
  console.log("🕵️‍♂️ Running Social & Google-Dork Discovery Engine...");
  const serperKey = process.env.SERPER_API_KEY;

  const allHits: SearchHit[] = [];

  for (const query of DORK_QUERIES) {
    if (serperKey) {
      const hits = await querySerper(query, serperKey);
      allHits.push(...hits);
    } else {
      const fallbackHits = await queryDuckDuckGoFallback(query);
      allHits.push(...fallbackHits);
    }
  }

  // Parse and validate hits
  const candidates: ScrapedInternshipInput[] = [];
  for (const hit of allHits) {
    const candidate = parseSearchResultToInternship(hit);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  const result = await upsertScrapedInternships(candidates);

  return {
    scannedQueries: DORK_QUERIES.length,
    rawHitsFound: allHits.length,
    validCandidates: candidates.length,
    added: result.added,
    skipped: result.skipped,
    rejectedByFilter: result.rejectedByFilter,
  };
}
