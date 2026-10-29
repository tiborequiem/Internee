import { NextRequest, NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret =
      body.adminSecret ||
      request.headers.get("x-admin-secret") ||
      "";

    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin secret passcode." },
        { status: 401 }
      );
    }

    const summary = await runScrapers();
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Scrape execution failed", message: err.message },
      { status: 500 }
    );
  }
}
