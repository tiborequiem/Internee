import { NextRequest, NextResponse } from "next/server";
import { isStrictEgyptInternship } from "@/lib/internship-filter";
import { upsertScrapedInternships } from "@/lib/queries";
import { detectSourceType } from "@/lib/scrapers/dork-scanner";

export const dynamic = "force-dynamic";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/software|developer|frontend|backend|swe|fullstack|data|ai|machine learning|cloud|cyber|mobile|ios|android/i.test(t)) {
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
  if (/mechanical|electrical|civil|automation|hardware|embedded|industrial|manufacturing|site/i.test(t)) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, handle } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    const cleanUrl = url.trim();
    try {
      new URL(cleanUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    const sourceType = detectSourceType(cleanUrl);
    let title = "";
    let companyName = "";
    let description = "";

    // 1. TikTok oEmbed support
    if (cleanUrl.includes("tiktok.com")) {
      try {
        const oembedRes = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
          { headers: { "User-Agent": USER_AGENT } }
        );
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          title = data.title || "";
          companyName = data.author_name || "TikTok Creator";
          description = data.title || "";
        }
      } catch {
        // Fallback
      }
    } else {
      // 2. Fetch OpenGraph tags
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(cleanUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const html = await res.text();

          const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
          const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
          const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
          const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

          title = ogTitleMatch ? ogTitleMatch[1] : titleTagMatch ? titleTagMatch[1].trim() : "";
          description = ogDescMatch ? ogDescMatch[1] : "";
          companyName = ogSiteMatch ? ogSiteMatch[1] : "";
        }
      } catch {
        // Continue with heuristics
      }
    }

    // Heuristic fallbacks if title still empty
    if (!title) {
      if (sourceType === "google_form") {
        title = "Summer Training & Internship Application";
        companyName = "Student Activity / Form";
      } else if (sourceType === "linkedin_post") {
        title = "LinkedIn Internship Opportunity";
        companyName = "LinkedIn Post";
      } else {
        title = "Student Internship Program";
        companyName = "Egyptian Community Employer";
      }
    }

    // Clean up title
    title = title
      .replace(/\|\s*LinkedIn.*$/i, "")
      .replace(/-\s*Google Forms.*$/i, "")
      .replace(/\|\s*Instagram.*$/i, "")
      .replace(/\|\s*TikTok.*$/i, "")
      .replace(/on LinkedIn.*$/i, "")
      .replace(/on Instagram.*$/i, "")
      .trim();

    if (!companyName || companyName === "LinkedIn" || companyName === "Google Docs") {
      const sepMatch = title.match(/^([A-Za-z0-9&.\s_()]+?)\s*[:|—–-]\s*(.+)$/);
      if (sepMatch && sepMatch[1].length < 35 && !/^(intern|internship|hiring)/i.test(sepMatch[1])) {
        companyName = sepMatch[1].trim();
        title = sepMatch[2].trim();
      } else {
        companyName = "Egyptian Employer";
      }
    }

    // Ensure intern keyword in title
    if (!/intern|trainee|graduate|academy|student|تدريب/i.test(title)) {
      title = `${title} Intern`;
    }

    const combinedText = `${title} ${description}`;
    const location = inferLocation(combinedText);
    const category = inferCategory(combinedText);
    const cleanHandle = handle ? (handle.startsWith("@") ? handle : `@${handle}`) : undefined;

    // Validate with strict Egyptian internship filter
    if (!isStrictEgyptInternship(title, location, Date.now())) {
      return NextResponse.json(
        {
          error:
            "This link does not meet the strict student internship criteria (e.g. contains junior, senior, full-time keywords, past year, or is not based in Egypt).",
        },
        { status: 422 }
      );
    }

    // Upsert into internships database
    const upsertRes = await upsertScrapedInternships([
      {
        companyName,
        title,
        category,
        location,
        applicationUrl: cleanUrl,
        source: "community",
        sourceType,
        submittedBy: cleanHandle,
        postedAt: Date.now(),
      },
    ]);

    if (upsertRes.added === 0 && upsertRes.skipped > 0) {
      return NextResponse.json(
        {
          success: true,
          message: "This internship link is already tracked on the board!",
          alreadyExisted: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Internship dropped successfully! Live on the board.",
      data: {
        title,
        companyName,
        category,
        location,
        applicationUrl: cleanUrl,
        sourceType,
        submittedBy: cleanHandle,
      },
    });
  } catch (err: any) {
    console.error("Quick drop error:", err);
    return NextResponse.json(
      { error: "Failed to process link. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
