import { NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const summary = await runScrapers();
    return NextResponse.json({
      success: true,
      summary,
      logs: [
        "Querying LinkedIn Undocumented Guest Jobs API (Dual-endpoint)...",
        "Fetching Wuzzuf Verified Egypt Internship feed & API...",
        "Querying Workable & SmartRecruiters ATS Public APIs...",
        "Scanning Indeed Egypt & Glassdoor listings...",
        "Executing Google Dorks on LinkedIn posts, Google Forms & Job indices...",
        "Validating extracted roles with strict dynamic recency filter...",
        `Scan complete: Discovered ${summary.totalDiscovered} total candidates (${summary.newRolesAdded} new roles live).`,
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Scan failed", message: err.message },
      { status: 500 }
    );
  }
}
