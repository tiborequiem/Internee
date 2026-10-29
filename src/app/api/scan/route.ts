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
        "Connecting to Workable API (Instabug, Paymob, Breadfast)...",
        "Querying LinkedIn Undocumented Guest Jobs API (f_E=1 native internship filter)...",
        "Crawling Wuzzuf Verified Egypt Internship feed...",
        "Executing Google Dorks on LinkedIn posts & job postings in Egypt...",
        "Executing Google Dorks on Google Forms summer training programs...",
        "Scanning Instagram & TikTok Egyptian youth training tags...",
        "Validating extracted titles with isStrictEgyptInternship recency filter...",
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
