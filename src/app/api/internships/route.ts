import { NextRequest, NextResponse } from "next/server";
import { getPublicInternships } from "@/lib/queries";
import { runScrapers } from "@/lib/scrapers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sector = searchParams.get("sector") || undefined;
  const category = searchParams.get("category") || undefined;
  const location = searchParams.get("location") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const source = searchParams.get("source") || undefined;

  try {
    let list = await getPublicInternships({
      sector,
      category,
      location,
      status,
      search,
      source,
    });

    // Auto-heal if live feed is empty
    if (!list.some((i) => i.source === "linkedin" || i.source === "wuzzuf")) {
      try {
        await runScrapers();
        list = await getPublicInternships({
          sector,
          category,
          location,
          status,
          search,
          source,
        });
      } catch {
        // Continue with current list
      }
    }

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
