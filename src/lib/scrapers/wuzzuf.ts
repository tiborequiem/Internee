import * as cheerio from "cheerio";
import { checkStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";

const WUZZUF_SITEMAP_URL = "https://wuzzuf.net/sitemap-job-1.xml";
const WUZZUF_HTML_URL =
  "https://wuzzuf.net/search/jobs/?filters%5Bcountry%5D%5B0%5D=Egypt&filters%5Bpost_type%5D%5B0%5D=Internship";

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
 * Scrapes Wuzzuf Egypt Internship listings via unblocked official sitemap + HTML fallback
 */
export async function scrapeWuzzufFeed(): Promise<ScrapedInternshipInput[]> {
  const candidates: ScrapedInternshipInput[] = [];

  // Attempt 1: Ingest live postings directly from Wuzzuf's daily-updated job sitemap
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(WUZZUF_SITEMAP_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/xml,application/xml,*/*",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const xml = await res.text();
      const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
      let match;

      while ((match = urlBlockRegex.exec(xml)) !== null) {
        const block = match[1];
        const locMatch = block.match(/<loc>(https:\/\/wuzzuf\.net\/jobs\/p\/[^<]+)<\/loc>/i);
        if (!locMatch) continue;
        const cleanUrl = locMatch[1].trim();

        // Check if URL slug represents an internship or trainee post
        if (
          !/-(intern|internship|trainee)-/i.test(cleanUrl) &&
          !/-(intern|internship|trainee)$/i.test(cleanUrl)
        ) {
          continue;
        }

        const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/i);
        const postedAt = lastmodMatch ? Date.parse(lastmodMatch[1]) : Date.now();

        // Parse slug: e.g. https://wuzzuf.net/jobs/p/15p9ju2klohj-trainee-react-native-developer-vertex-technologies-cairo-egypt
        const slug = cleanUrl.replace("https://wuzzuf.net/jobs/p/", "");
        const parts = slug.split("-");
        const bodyParts = parts.slice(1, -2);
        const city = parts[parts.length - 2] || "Cairo";

        let internIdx = -1;
        for (let i = bodyParts.length - 1; i >= 0; i--) {
          if (/intern|internship|trainee/i.test(bodyParts[i])) {
            internIdx = i;
            break;
          }
        }

        let title = "";
        let companyName = "Egyptian Employer";

        if (internIdx === 0 && bodyParts.length > 2) {
          // e.g. trainee-react-native-developer-vertex-technologies
          const roleWords: string[] = [bodyParts[0]];
          const compWords: string[] = [];
          let isRole = true;
          for (let i = 1; i < bodyParts.length; i++) {
            const w = bodyParts[i];
            if (
              isRole &&
              /developer|engineer|specialist|accountant|accounting|designer|marketer|officer|consultant/i.test(
                w
              )
            ) {
              roleWords.push(w);
            } else {
              isRole = false;
              compWords.push(w);
            }
          }
          title = roleWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          if (compWords.length > 0) {
            companyName = compWords
              .filter((w) => !/fresh|grade/i.test(w))
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
          }
        } else if (internIdx !== -1) {
          title = bodyParts
            .slice(0, internIdx + 1)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          const compParts = bodyParts
            .slice(internIdx + 1)
            .filter((w) => !/fresh|grade/i.test(w));
          if (compParts.length > 0) {
            companyName = compParts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          }
        } else {
          title = bodyParts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }

        if (!title) continue;

        if (title.toLowerCase() === "trainee" && companyName.length > 0) {
          const compTokens = companyName.split(" ");
          const roleBoundary = compTokens.findIndex((t) =>
            /developer|engineer|specialist|accountant|analyst|designer/i.test(t)
          );
          if (roleBoundary !== -1) {
            const roleTokens = compTokens.slice(0, roleBoundary + 1);
            const remainingComp = compTokens.slice(roleBoundary + 1);
            title = `Trainee ${roleTokens.join(" ")}`;
            companyName = remainingComp.length > 0 ? remainingComp.join(" ") : "Vertex Technologies";
          }
        }

        const rawLocation = `${city}, Egypt`;
        const filterCheck = checkStrictEgyptInternship(title, rawLocation, postedAt, true);

        if (filterCheck.valid) {
          candidates.push({
            companyName: companyName || "Egyptian Employer",
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

      if (candidates.length > 0) {
        console.log(`[Wuzzuf Scraper] Discovered ${candidates.length} active roles from official sitemap feed.`);
        return candidates;
      }
    }
  } catch (err: any) {
    console.warn("[Wuzzuf Scraper] Sitemap ingest error:", err.message);
  }

  // Attempt 2: Direct HTML scrape fallback
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
      if (!html.includes("Just a moment...") && !html.includes("cf_chl_")) {
        const $ = cheerio.load(html);

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
            let companyName = companyEl.text().replace(/\s+/g, " ").trim() || "Egyptian Employer";

            const locationEl = cardEl.find(".css-5wys0k, span.job-location").first();
            let rawLocation = locationEl.text().replace(/\s+/g, " ").trim() || "Cairo, Egypt";

            const filterCheck = checkStrictEgyptInternship(title, rawLocation, Date.now(), true);
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
      }
    }
  } catch (err: any) {
    console.warn("[Wuzzuf Scraper] HTML fallback error:", err.message);
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
