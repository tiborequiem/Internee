import { NextRequest, NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Check Authorization header: Bearer ${process.env.CRON_SECRET}
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is not set." },
      { status: 500 }
    );
  }

  const expectedHeader = `Bearer ${expectedSecret}`;
  if (!authHeader || authHeader !== expectedHeader) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing bearer token." },
      { status: 401 }
    );
  }

  try {
    const summary = await runScrapers();
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Scraper cron error:", error);
    return NextResponse.json(
      { error: "Scraper execution failed", message: error.message },
      { status: 500 }
    );
  }
}
